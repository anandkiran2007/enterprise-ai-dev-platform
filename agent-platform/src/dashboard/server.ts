
import express from 'express';
import cors from 'cors';
import { ProjectMemory } from '../core/memory';
import { EventType } from '../core/events';
import { IEventBus } from '../core/event_bus_adapters';
import { IStorageAdapter } from '../core/storage';

export class DashboardServer {
    private app = express();
    private port = 4000;
    private memory: ProjectMemory;
    private eventBus: IEventBus;
    private storage: IStorageAdapter;
    private paymentService?: any; // To avoid circular dependency issues during import if files not compiled yet, using any momentarily or PaymentService
    private eventLog: any[] = [];

    constructor(memory: ProjectMemory, eventBus: IEventBus, storage: IStorageAdapter) {
        this.memory = memory;
        this.eventBus = eventBus;
        this.storage = storage;
        this.storage = storage;
        this.app.use(cors());

        // We need raw body for stripe webhooks, so we apply json parser conditionally later or use a specific route
        // Standard express.json() consumes the stream, making it hard for Stripe to verify signature.
        // We'll handle this in route setup.

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const clerkKey = process.env.CLERK_SECRET_KEY;

        if (stripeKey && clerkKey) {
            if (stripeKey.includes('PLACEHOLDER') || clerkKey.includes('PLACEHOLDER')) {
                console.error('❌ [Dashboard] Payment Service ERROR: Keys contain "PLACEHOLDER". Please update .env!');
            } else {
                console.log('[Dashboard] Initializing Payment Service 💳');
                try {
                    const { PaymentService } = require('../core/payment');
                    this.paymentService = new PaymentService(stripeKey, clerkKey);
                } catch (e: any) {
                    console.error('[Dashboard] Failed to load Payment Service:', e.message);
                }
            }
        } else {
            console.warn('[Dashboard] Payment Service skipped (Missing Keys in .env)');
        }

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
        console.log('[Dashboard] Setting up API Routes... 🛣️');

        // Debug: Print all registered routes later or just log here
        this.app.use((req, res, next) => {
            console.log(`[Dashboard] Request: ${req.method} ${req.url}`);
            next();
        });
        // Webhook (Must come before express.json)
        this.app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!this.paymentService || !sig || !webhookSecret) {
                return res.status(400).send('Payment service not configured');
            }

            try {
                await this.paymentService.handleWebhook(sig as string, req.body, webhookSecret);
                res.json({ received: true });
            } catch (err: any) {
                console.error(`Webhook Error: ${err.message}`);
                res.status(400).send(`Webhook Error: ${err.message}`);
            }
        });

        this.app.use(express.json()); // Enable JSON body parsing for other routes

        // Checkout Session
        this.app.post('/api/payment/checkout', async (req, res) => {
            const { returnUrl, email } = req.body;
            const userId = req.headers['x-user-id'] as string;

            if (!this.paymentService) {
                return res.status(503).json({ error: 'Payment service unavailable' });
            }

            if (!userId || !email) {
                return res.status(400).json({ error: 'User ID and Email required' });
            }

            try {
                const url = await this.paymentService.createCheckoutSession(userId, email, returnUrl);
                res.json({ url });
            } catch (e: any) {
                console.error('[Stripe Error Details] 🚨');
                console.error('Message:', e.message);
                console.error('Type:', e.type);
                console.error('Code:', e.code);
                console.error('Decline Code:', e.decline_code);
                res.status(500).json({ error: e.message });
            }
        });

        this.app.get('/api/memory', (req, res) => {
            res.json(this.memory.getSnapshot());
        });

        this.app.get('/api/events', (req, res) => {
            res.json(this.eventLog);
        });

        this.app.get('/api/projects', async (req, res) => {
            try {
                // Extract User ID from Clerk header
                const userId = req.headers['x-user-id'] as string;
                const projects = await this.storage.listProjects(userId);
                res.json(projects);
            } catch (e) {
                res.status(500).json({ error: 'Failed to fetch projects' });
            }
        });

        this.app.post('/api/project/load', async (req, res) => {
            const { projectId } = req.body;
            const userId = req.headers['x-user-id'] as string;

            if (!projectId) return res.status(400).json({ error: 'Project ID required' });

            try {
                await this.memory.load(projectId, userId);

                // Verify we actually loaded something (in case of auth failure)
                const snapshot = this.memory.getSnapshot();
                if (userId && snapshot.owner_id && snapshot.owner_id !== userId) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                // Also reset event log?
                this.eventLog = [];
                res.json({ success: true, message: `Loaded project ${projectId}` });
            } catch (e) {
                console.error('[Dashboard] Failed to load project', e);
                res.status(500).json({ error: 'Failed to load project' });
            }
        });

        this.app.post('/api/idea', (req, res) => {
            const { idea } = req.body;
            const userId = req.headers['x-user-id'] as string;

            if (!idea) {
                return res.status(400).json({ error: 'Idea is required' });
            }

            // Set owner for the new project state
            if (userId) {
                this.memory.setOwner(userId);
            }

            console.log(`[Dashboard] Received new idea via API: "${idea}" from user ${userId || 'anon'}`);

            this.eventBus.emit(EventType.USER_IDEA_SUBMITTED, 'user', {
                idea: idea,
                timestamp: new Date(),
                userId: userId
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
                res.status(500).json({ success: false, message: 'Configuration failed' });
            }
        });

        // Debug: Catch-all 404 (Place this last)
        this.app.use((req, res) => {
            console.log(`[Dashboard] 404 Not Found: ${req.method} ${req.url}`);
            res.status(404).json({ error: 'Route not found', path: req.url, method: req.method });
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`[Dashboard] Server running at http://localhost:${this.port}`);
        });
    }
}
