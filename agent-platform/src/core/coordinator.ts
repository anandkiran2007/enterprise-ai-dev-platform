
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

            // Poll agents - SEQUENTIAL EXECUTION ENFORCED
            for (const agent of this.agents) {
                // Global Lock Check: Is anyone else working?
                const snapshot = this.memory.getSnapshot();
                const activeContexts = Object.values(snapshot.agent_context_pointers);
                const isSystemBusy = activeContexts.some(ctx =>
                    ctx.currently_working_on !== 'idle' &&
                    ctx.currently_working_on !== '' &&
                    ctx.currently_working_on !== 'Waiting for tasks...'
                );

                // If system is busy, ONLY the agent who is working can proceed
                // (We allow the working agent to call act() again to finish their work)
                const myContext = snapshot.agent_context_pointers[agent.role];
                const amIWorking = myContext && myContext.currently_working_on !== 'idle' && myContext.currently_working_on !== '';

                if (isSystemBusy && !amIWorking) {
                    // console.log(`[Coordinator] Skipping ${agent.role} because system is busy.`);
                    continue;
                }

                const didWork = await agent.act();
                if (didWork) {
                    // One agent did work, so we break the loop to let them finish 
                    // and re-evaluate state in next iteration. 
                    // This enforces "One Step at a Time".
                    break;
                }
            }

            // Simulate time passing / event processing
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.isRunning = false;
        console.log('[Coordinator] Loop finished.');
    }
}
