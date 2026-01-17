import { ProjectMemoryState } from '../memory';

export interface IStorageAdapter {
    load(projectId: string): Promise<ProjectMemoryState | null>;
    save(state: ProjectMemoryState): Promise<void>;
}

export class FileStorageAdapter implements IStorageAdapter {
    async load(projectId: string): Promise<ProjectMemoryState | null> {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'persistence', 'memory.json');

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
            path.join(persistenceDir, 'memory.json'),
            JSON.stringify(state, null, 2)
        );
    }
}
