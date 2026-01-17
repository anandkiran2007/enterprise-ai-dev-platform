import { ProjectMemoryState } from '../memory';

export interface IStorageAdapter {
    load(projectId: string): Promise<ProjectMemoryState | null>;
    save(state: ProjectMemoryState): Promise<void>;
    listProjects(): Promise<Array<{ id: string; name: string; last_updated: Date }>>;
}

export class FileStorageAdapter implements IStorageAdapter {
    async load(projectId: string): Promise<ProjectMemoryState | null> {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'persistence', `${projectId}.json`);

        // Backward compatibility for single file
        if (!fs.existsSync(filePath) && fs.existsSync(path.join(process.cwd(), 'persistence', 'memory.json'))) {
            const data = fs.readFileSync(path.join(process.cwd(), 'persistence', 'memory.json'), 'utf-8');
            const state = JSON.parse(data);
            if (state.project_id === projectId) return state;
        }

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
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

    async listProjects(): Promise<Array<{ id: string; name: string; last_updated: Date }>> {
        const fs = require('fs');
        const path = require('path');
        const persistenceDir = path.join(process.cwd(), 'persistence');

        if (!fs.existsSync(persistenceDir)) return [];

        const files = fs.readdirSync(persistenceDir).filter((f: string) => f.endsWith('.json'));
        return files.map((f: string) => {
            const data = JSON.parse(fs.readFileSync(path.join(persistenceDir, f), 'utf-8'));
            return {
                id: data.project_id,
                name: data.project_name || 'Untitled Project',
                last_updated: new Date(data.state_snapshot.last_updated)
            };
        });
    }
}
