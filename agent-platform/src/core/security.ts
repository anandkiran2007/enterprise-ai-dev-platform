
import * as fs from 'fs';
import * as path from 'path';

export class CredentialManager {
    private static instance: CredentialManager;
    private keys: Map<string, string>;
    private configPath: string;

    private constructor() {
        this.keys = new Map();
        this.configPath = path.join(process.cwd(), '.agent_secrets.json');
        this.load();
    }

    public static getInstance(): CredentialManager {
        if (!CredentialManager.instance) {
            CredentialManager.instance = new CredentialManager();
        }
        return CredentialManager.instance;
    }

    public setKey(service: string, key: string) {
        this.keys.set(service, key);
        this.save();
    }

    public getKey(service: string): string | undefined {
        return this.keys.get(service) || process.env[service.toUpperCase() + '_API_KEY'];
    }

    private load() {
        if (fs.existsSync(this.configPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
                for (const [key, value] of Object.entries(data)) {
                    this.keys.set(key, value as string);
                }
            } catch (e) {
                console.error('Failed to load credentials', e);
            }
        }
    }

    private save() {
        const data: any = {};
        this.keys.forEach((value, key) => {
            data[key] = value;
        });
        fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    }
}
