
import { BaseAgent } from './base';
import { EventType } from '../core/events';

export class UXDesignerAgent extends BaseAgent {
    constructor(memory: any, eventBus: any, llm: any) {
        super('ux_designer', memory, eventBus, llm);
    }

    initialize() {
        this.eventBus.subscribe(EventType.REQUIREMENTS_APPROVED, (event: any) => {
            console.log(`[UX Designer] Requirements Approved! Starting design...`);
            this.handleRequirements(event.payload);
        });
    }

    protected getRelevantArtifacts(snapshot: any) {
        return {
            requirements: snapshot.living_documents.requirements
        };
    }

    async act(): Promise<boolean> {
        // In a real agent, this would check "my_context" for pending tasks
        // For this demo, we'll check if we have a "pending" status in memory or just react to events
        // But since we are event-driven, the 'subscribe' handler does the work usually.
        // However, the coordinator calls 'act()' to give agent a chance to do long-running work.

        const context = this.getContext();

        // Check if we are supposed to be working on something
        if (context.my_current_task && context.my_current_task.currently_working_on === 'high_fidelity_mockups') {
            // Simulate work
            console.log('[UX Designer] Working on Figma designs...');

            // ... time passes ...

            // Complete the work
            await this.finishDesign();
            return true;
        }

        return false;
    }

    private handleRequirements(payload: any) {
        this.memory.updatePhase('design');

        // Update my status to "working"
        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'high_fidelity_mockups',
            next_tasks: ['review_with_po']
        });

        // In a real system, we'd fire off an LLM call here or a Figma plugin action
    }

    private async finishDesign() {
        console.log('[UX Designer] Designs complete. Updating memory.');

        // Artificial delay for visualization
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { AGENT_PROMPTS } = require('../core/prompts');
        const summary = await this.llm.generateText([
            { role: 'system', content: AGENT_PROMPTS.ux_designer },
            { role: 'user', content: 'Generate a design description for the current requirements.' }
        ]);

        this.memory.updateDocument('ux_design', {
            figma_url: 'https://figma.com/file/mock-project-id',
            design_system_url: 'storage://design_tokens.json',
            summary: summary
        });

        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'idle',
            next_tasks: []
        });

        this.eventBus.emit(EventType.UX_DESIGN_READY, this.role, {
            summary: 'Designs are ready for review and implementation.'
        });
    }
}
