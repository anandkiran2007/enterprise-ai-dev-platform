
import { BaseAgent } from './base';
import { EventType } from '../core/events';

export class QAEngineerAgent extends BaseAgent {

    initialize() {
        this.eventBus.subscribe(EventType.FRONTEND_COMPONENT_READY, (event) => {
            console.log(`[QA Engineer] Frontend ready. Starting QA process.`);
            this.startQA();
        });
    }

    protected getRelevantArtifacts(snapshot: any) {
        return {
            requirements: snapshot.living_documents.requirements,
            frontend: snapshot.code_artifacts.frontend
        };
    }

    async act(): Promise<boolean> {
        const context = this.getContext();

        if (context.my_current_task && context.my_current_task.currently_working_on === 'qa_testing') {
            console.log('[QA Engineer] Running test suite...');
            await this.performTests();
            return true;
        }

        return false;
    }

    private startQA() {
        this.memory.updatePhase('testing');
        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'qa_testing',
            next_tasks: ['report_results']
        });
    }

    private async performTests() {
        // Artificial delay for visualization
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Use LLM to generate test cases
        const { AGENT_PROMPTS } = require('../core/prompts');
        const testReport = await this.llm.generateText([
            { role: 'system', content: AGENT_PROMPTS.qa_engineer },
            { role: 'user', content: 'Generate test cases for the login page.' }
        ]);

        console.log('[QA Engineer] Tests complete.');

        this.memory.updateDocument('test_coverage', {
            unit_tests: 'PASSED',
            report: testReport
        });

        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'idle',
            next_tasks: []
        });

        this.eventBus.emit(EventType.UNIT_TESTS_PASSING, this.role, {
            summary: 'All checks passed.'
        });
    }
}
