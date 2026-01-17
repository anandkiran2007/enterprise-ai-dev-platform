
import { BaseAgent } from './base';
import { EventType } from '../core/events';

export class FrontendSDEAgent extends BaseAgent {
    private hasDesign = false;
    private hasApi = false;

    constructor(memory: any, eventBus: any, llm: any) {
        super('frontend_sde', memory, eventBus, llm);
    }

    initialize() {
        this.eventBus.subscribe(EventType.UX_DESIGN_READY, (event: any) => {
            console.log(`[Frontend SDE] Received UX designs.`);
            this.hasDesign = true;
            this.checkDependencies();
        });

        this.eventBus.subscribe(EventType.API_CONTRACT_DEFINED, (event: any) => {
            console.log(`[Frontend SDE] Received API contracts.`);
            this.hasApi = true;
            this.checkDependencies();
        });
    }

    protected getRelevantArtifacts(snapshot: any) {
        return {
            ux_design: snapshot.living_documents.ux_design,
            api_contracts: snapshot.living_documents.api_contracts
        };
    }

    async act(): Promise<boolean> {
        const context = this.getContext();
        const snapshot = this.memory.getSnapshot();

        // Auto-Resume / Catch-up Logic
        if (context.project_phase === 'development') {
            // Check if we have artifacts but haven't generated code
            const hasUX = !!snapshot.living_documents.ux_design;
            const hasAPI = !!snapshot.living_documents.api_contracts;
            const hasCode = !!snapshot.code_artifacts.frontend?.generated_code;

            if (hasUX && hasAPI && !hasCode && context.my_current_task.currently_working_on !== 'frontend_implementation') {
                console.log('[Frontend SDE] Found inputs but no code. Auto-starting implementation.');
                this.hasDesign = true;
                this.hasApi = true;
                this.checkDependencies();
                return true;
            }
        }

        if (context.my_current_task && context.my_current_task.currently_working_on === 'frontend_implementation') {
            console.log('[Frontend SDE] Generating React components...');
            await this.finishImplementation();
            return true;
        }

        return false;
    }

    private checkDependencies() {
        if (this.hasDesign && this.hasApi) {
            console.log('[Frontend SDE] All dependencies met. Starting implementation.');
            this.memory.updateAgentContext(this.role, {
                currently_working_on: 'frontend_implementation',
                next_tasks: ['unit_tests']
            });
        } else {
            const missing = [];
            if (!this.hasDesign) missing.push('UX Design');
            if (!this.hasApi) missing.push('API Contracts');
            console.log(`[Frontend SDE] Waiting for dependencies: ${missing.join(', ')}`);
        }
    }

    private async finishImplementation() {
        console.log('[Frontend SDE] Frontend implementation complete.');

        // Artificial delay for visualization
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { AGENT_PROMPTS } = require('../core/prompts');
        const componentCode = await this.llm.generateText([
            { role: 'system', content: AGENT_PROMPTS.frontend_sde },
            { role: 'user', content: 'Generate a React component for the main view.' }
        ]);

        this.memory.updateCodeArtifact('frontend', {
            structure_summary: 'React + TypeScript',
            entry_points: ['src/App.tsx'],
            repository_url: 'storage://frontend_repo/',
            generated_code: componentCode
        });

        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'idle',
            next_tasks: ['integration_testing']
        });

        this.eventBus.emit(EventType.FRONTEND_COMPONENT_READY, this.role, {
            summary: 'Frontend components generated and linked to API.',
            componentCode: componentCode
        });
    }
}
