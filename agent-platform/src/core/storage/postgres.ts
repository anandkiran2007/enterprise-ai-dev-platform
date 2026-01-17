
import { IStorageAdapter } from './index';
import { ProjectMemoryState } from '../memory';
import { Pool } from 'pg';

export class PostgresStorageAdapter implements IStorageAdapter {
    private pool: Pool;

    constructor(connectionString: string) {
        this.pool = new Pool({
            connectionString,
        });
        this.init();
    }

    private async init() {
        // Simple Key-Value store table for MVP
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS project_memory (
                project_id VARCHAR(255) PRIMARY KEY,
                state JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    async load(projectId: string): Promise<ProjectMemoryState | null> {
        try {
            const res = await this.pool.query(
                `SELECT state FROM project_memory WHERE project_id = $1`,
                [projectId]
            );
            return res.rows[0]?.state || null;
        } catch (e) {
            console.error('[Postgres] Failed to load state', e);
            return null;
        }
    }

    async listProjects(): Promise<Array<{ id: string; name: string; last_updated: Date }>> {
        try {
            const res = await this.pool.query(
                `SELECT project_id, state->>'project_name' as name, updated_at FROM project_memory ORDER BY updated_at DESC`
            );
            return res.rows.map(row => ({
                id: row.project_id,
                name: row.name || 'Untitled Project',
                last_updated: row.updated_at
            }));
        } catch (e) {
            console.error('[Postgres] Failed to list projects', e);
            return [];
        }
    }

    async save(state: ProjectMemoryState): Promise<void> {
        try {
            await this.pool.query(
                `INSERT INTO project_memory (project_id, state, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (project_id)
                 DO UPDATE SET state = $2, updated_at = NOW()`,
                [state.project_id, state]
            );
        } catch (e) {
            console.error('[Postgres] Failed to save state', e);
        }
    }
}
