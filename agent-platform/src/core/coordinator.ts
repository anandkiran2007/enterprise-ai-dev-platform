
import { ProjectMemory } from './memory';
import { IEventBus } from './event_bus_adapters';
import { BaseAgent } from '../agents/base';

export class AgentCoordinator {
    private memory: ProjectMemory;
    private eventBus: IEventBus;
    private agents: BaseAgent[] = [];
    private isRunning: boolean = false;

    constructor(memory: ProjectMemory, eventBus: IEventBus) {
        this.memory = memory;
        this.eventBus = eventBus;
    }

    registerAgent(agent: BaseAgent) {
        this.agents.push(agent);
        agent.initialize();
        console.log(`[Coordinator] Registered agent: ${agent.role}`);
    }

    async run(iterations: number = 5) {
        this.isRunning = true;
        console.log('[Coordinator] Starting loop...');

        for (let i = 0; i < iterations; i++) {
            console.log(`\n--- Iteration ${i + 1} ---`);

            // Poll agents
            for (const agent of this.agents) {
                const didWork = await agent.act();
                if (didWork) {
                    // Give other agents a chance to react to events immediately if we wanted
                    // For now, we just proceed to next agent
                }
            }

            // Simulate time passing / event processing
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.isRunning = false;
        console.log('[Coordinator] Loop finished.');
    }
}
