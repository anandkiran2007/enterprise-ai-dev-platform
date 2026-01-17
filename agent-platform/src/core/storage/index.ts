import { ProjectMemoryState } from '../memory';

export interface IStorageAdapter {
    load(projectId: string, userId?: string): Promise<ProjectMemoryState | null>;
    save(state: ProjectMemoryState): Promise<void>;
    listProjects(userId?: string): Promise<Array<{ id: string; name: string; last_updated: Date }>>;
}

export class FileStorageAdapter implements IStorageAdapter {
    async load(projectId: string, userId?: string): Promise<ProjectMemoryState | null> {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'persistence', `${projectId}.json`);

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const state = JSON.parse(data);
            // Security check: if userId is provided, ensure it matches owner_id
            if (userId && state.owner_id && state.owner_id !== userId) {
                console.warn(`[Security] Unauthorized access attempt by ${userId} to project ${projectId}`);
                return null;
            }
            return state;
        }
        return null;
    }

    async save(state: ProjectMemoryState): Promise<void> {
        const fs = require('fs');
        const path = require('path');
        const persistenceDir = path.join(process.cwd(), 'persistence');
        if (!fs.existsSync(persistenceDir)) {
            fs.mkdirSync(persistenceDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(persistenceDir, `${state.project_id}.json`),
            JSON.stringify(state, null, 2)
        );
    }

    async listProjects(userId?: string): Promise<Array<{ id: string; name: string; last_updated: Date }>> {
        const fs = require('fs');
        const path = require('path');
        const persistenceDir = path.join(process.cwd(), 'persistence');

        if (!fs.existsSync(persistenceDir)) return [];

        const files = fs.readdirSync(persistenceDir).filter((f: string) => f.endsWith('.json'));
        return files.map((f: string) => {
            const data = JSON.parse(fs.readFileSync(path.join(persistenceDir, f), 'utf-8'));
            return {
                id: data.project_id,
                owner_id: data.owner_id,
                name: data.project_name || 'Untitled Project',
                last_updated: new Date(data.state_snapshot.last_updated)
            };
        }).filter((project: any) => {
            // If userId is provided, only show projects owned by that user
            // If project has no owner_id (legacy), show it to everyone (or maybe migrate it?)
            // For now: visible if no owner OR owner matches
            if (!userId) return true; // generic view
            return !project.owner_id || project.owner_id === userId;
        });
    }
}
