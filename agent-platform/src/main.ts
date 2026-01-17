
import { ProjectMemory } from './core/memory';
import { AgentCoordinator } from './core/coordinator';
import { MockLLMService } from './core/llm';
import { OpenAILLMService } from './core/openai_service';
import * as dotenv from 'dotenv';

import { ProductOwnerAgent } from './agents/product_owner';
import { UXDesignerAgent } from './agents/ux_designer';
import { BackendSDEAgent } from './agents/backend_sde';
import { FrontendSDEAgent } from './agents/frontend_sde';
import { QAEngineerAgent } from './agents/qa_engineer';
import { DevOpsAgent } from './agents/devops';
import { TeacherAgent } from './agents/teacher';
import { DashboardServer } from './dashboard/server';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function main() {
    console.log('--- Initializing Enterprise AI Dev Platform ---');

    // 1. Setup Infrastructure
    const projectId = uuidv4();

    // Storage Adapter Selection
    let storageAdapter;
    if (process.env.POSTGRES_HOST) {
        console.log('[System] Using PostgreSQL Storage 🐘');
        const { PostgresStorageAdapter } = require('./core/storage/postgres');
        const connString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
        storageAdapter = new PostgresStorageAdapter(connString);
    } else {
        console.log('[System] Using File System Storage (Local Mode) 📂');
        const { FileStorageAdapter } = require('./core/storage');
        storageAdapter = new FileStorageAdapter();
    }

    const memory = new ProjectMemory(projectId, storageAdapter);

    // Check for previous session
    await memory.load();

    const eventBus = process.env.REDIS_HOST
        ? new (require('./core/event_bus_adapters').RedisEventBus)(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`)
        : new (require('./core/event_bus_adapters').InMemoryEventBus)();

    if (process.env.REDIS_HOST) {
        console.log('[System] Using Redis Event Bus 🚀');
    } else {
        console.log('[System] Using In-Memory Event Bus (Local Mode)');
    }

    // Choose Provider
    let llm;
    if (process.env.LLM_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
        console.log('[System] Using Real OpenAI Service (Cost Efficient Mode)');
        llm = new OpenAILLMService(process.env.OPENAI_API_KEY);
    } else {
        console.log('[System] Using MOCK LLM Service (Simulated)');
        llm = new MockLLMService();
    }

    const coordinator = new AgentCoordinator(memory, eventBus);

    // 2. Start Dashboard
    const dashboard = new DashboardServer(memory, eventBus);
    dashboard.start();

    // 3. Initialize Agents
    const poAgent = new ProductOwnerAgent('product_owner', memory, eventBus, llm);
    const uxAgent = new UXDesignerAgent(memory, eventBus, llm);
    const backendAgent = new BackendSDEAgent(memory, eventBus, llm);
    const frontendAgent = new FrontendSDEAgent(memory, eventBus, llm);
    const qaAgent = new QAEngineerAgent('qa_engineer', memory, eventBus, llm);
    const devopsAgent = new DevOpsAgent('devops', memory, eventBus, llm);
    const teacherAgent = new TeacherAgent('teacher', memory, eventBus, llm);

    coordinator.registerAgent(poAgent);
    coordinator.registerAgent(uxAgent);
    coordinator.registerAgent(backendAgent);
    coordinator.registerAgent(frontendAgent);
    coordinator.registerAgent(qaAgent);
    coordinator.registerAgent(devopsAgent);
    coordinator.registerAgent(teacherAgent);

    // 4. Start the Flow: User Idea
    // Only start new idea if memory was empty
    if (memory.getSnapshot().state_snapshot.active_agents.length === 0 && !memory.getSnapshot().living_documents.requirements) {
        console.log(`\n[System] Waiting for user idea via Dashboard (http://localhost:3001)...`);
    } else {
        console.log('\n[System] Resumed from existing state. Continuing loop...');
    }

    // 5. Run Coordinator Loop
    // Increase loop count or make infinite for server mode
    await coordinator.run(1000);

    // 6. Inspect Final State
    console.log('\n--- Final Project Memory State ---');
    const snapshot = memory.getSnapshot();
    console.log('Living Documents:', JSON.stringify(snapshot.living_documents, null, 2));

    console.log('\n[System] Dashboard is still running at http://localhost:3000');
    console.log('[System] Press Ctrl+C to stop.');

    // Keep alive for dashboard
    await new Promise(() => { });
}

main().catch(console.error);
