
import express from 'express';
import cors from 'cors';
import { ProjectMemory } from '../core/memory';
import { EventType } from '../core/events';
import { IEventBus } from '../core/event_bus_adapters';

export class DashboardServer {
    private app = express();
    private port = 3000;
    private memory: ProjectMemory;
    private eventBus: IEventBus;
    private eventLog: any[] = [];

    constructor(memory: ProjectMemory, eventBus: IEventBus) {
        this.memory = memory;
        this.eventBus = eventBus;
        this.app.use(cors());
        this.app.use(express.static('src/dashboard/public'));

        // Capture all events
        Object.values(EventType).forEach(type => {
            this.eventBus.subscribe(type as EventType, (event) => {
                this.eventLog.unshift(event); // Newest first
                if (this.eventLog.length > 50) this.eventLog.pop();
            });
        });

        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.use(express.json()); // Enable JSON body parsing

        this.app.get('/api/memory', (req, res) => {
            res.json(this.memory.getSnapshot());
        });

        this.app.get('/api/events', (req, res) => {
            res.json(this.eventLog);
        });

        this.app.post('/api/idea', (req, res) => {
            const { idea } = req.body;
            if (!idea) {
                return res.status(400).json({ error: 'Idea is required' });
            }

            console.log(`[Dashboard] Received new idea via API: "${idea}"`);

            this.eventBus.emit(EventType.USER_IDEA_SUBMITTED, 'user', {
                idea: idea,
                timestamp: new Date()
            });

            res.json({ success: true, message: 'Idea submitted to agents' });
        });

        this.app.post('/api/approve', (req, res) => {
            console.log(`[Dashboard] User Approved Requirements.`);

            // Allow user to approve specifically requirements, but generically for now
            this.eventBus.emit(EventType.REQUIREMENTS_APPROVED, 'user', {
                timestamp: new Date(),
                summary: "User approved requirements via dashboard"
            });

            res.json({ success: true, message: 'Approval sent to agents' });
        });

        this.app.post('/api/config/github', (req, res) => {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token required' });
            }

            try {
                const { CredentialManager } = require('../core/security');
                CredentialManager.getInstance().setKey('github', token);
                console.log('[Dashboard] GitHub token configured.');
                res.json({ success: true, message: 'GitHub configured successfully' });
            } catch (e) {
                console.error('Failed to configure GitHub', e);
                res.status(500).json({ success: false, message: 'Configuration failed' });
            }
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`[Dashboard] Server running at http://localhost:${this.port}`);
        });
    }
}
