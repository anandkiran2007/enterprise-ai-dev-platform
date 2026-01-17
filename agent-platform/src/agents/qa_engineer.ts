
import { BaseAgent } from './base';
import { EventType } from '../core/events';
import { ExecutionSandbox } from '../core/sandbox';
import * as fs from 'fs';
import * as path from 'path';

export class QAEngineerAgent extends BaseAgent {

    initialize() {
        this.eventBus.subscribe(EventType.FRONTEND_COMPONENT_READY, (event) => {
            console.log(`[QA Engineer] Frontend ready. Starting QA process.`);
            this.startQA(event.payload?.componentCode);
        });
    }

    protected getRelevantArtifacts(snapshot: any) {
        return {
            requirements: snapshot.living_documents.requirements,
            frontend: snapshot.code_artifacts.frontend
        };
    }

    private isTestRunning = false;

    async act(): Promise<boolean> {
        // State Reconciliation / Auto-Resume Logic
        const snapshot = this.memory.getSnapshot();
        const context = snapshot.agent_context_pointers[this.role];
        const isPhaseCorrect = snapshot.current_phase === 'testing';
        const isIdle = context.currently_working_on === 'idle' || context.currently_working_on === 'qa_testing';
        const hasPassed = snapshot.living_documents['test_coverage']?.unit_tests === 'PASSED';

        // If we are in testing phase, haven't passed, and aren't currently running (in this process)
        if (isPhaseCorrect && !hasPassed && !this.isTestRunning) {
            console.log('[QA Engineer] Detected pending QA task from saved state. Resuming...');
            const code = snapshot.code_artifacts.frontend?.generated_code;
            if (code) {
                this.startQA(code);
                return true;
            } else {
                console.log('[QA Engineer] Cannot test: No frontend code found. Reverting to Development phase.');
                this.memory.updatePhase('development');
                return true;
            }
        }
        return false;
    }

    private startQA(componentCode?: string) {
        if (this.isTestRunning) return;
        this.isTestRunning = true;

        this.memory.updatePhase('testing');
        this.memory.updateAgentContext(this.role, {
            currently_working_on: 'qa_testing',
            next_tasks: ['report_results']
        });

        // Trigger asynchronous testing
        this.performTests(componentCode)
            .catch(err => {
                console.error('[QA Engineer] Test execution failed:', err);
                this.emitFailure('test_execution', err.message);
            })
            .finally(() => {
                this.isTestRunning = false;
            });
    }

    private async performTests(componentCode?: string) {
        if (!componentCode) {
            console.log('[QA Engineer] No code provided for testing.');
            return;
        }

        console.log('[QA Engineer] Generating test cases via LLM...');
        const { AGENT_PROMPTS } = require('../core/prompts');

        // 1. Generate Test Code
        const prompt = this.replacePlaceholders(AGENT_PROMPTS.qa_engineer, {
            role: this.role,
            context: `Component Code:\n${componentCode}\n\nTask: Write a Jest/Node test script for this component. Ensure it console.logs 'PASS' on success.`
        });

        const response = await this.llm.generateText([{ role: 'user', content: prompt }]);
        // Extract code block if present
        const testCode = this.extractCodeBlock(response) || response;

        console.log('[QA Engineer] Test Code Generated. Preparing Sandbox...');

        // 2. Prepare Sandbox Context
        const tempDir = path.join(process.cwd(), 'temp_execution', `qa_${Date.now()}`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Write test file
        fs.writeFileSync(path.join(tempDir, 'test_runner.js'), testCode);

        // 3. Execute in Sandbox
        const sandbox = ExecutionSandbox.getInstance();
        console.log(`[QA Engineer] Running in Sandbox (node:18-alpine)...`);

        const result = await sandbox.runScript(
            'node:18-alpine',
            `node /app/test_runner.js`,
            tempDir
        );

        console.log(`[QA Engineer] Sandbox Execution Complete.`);
        console.log(`[Sandbox Output] ${result.stdout}`);

        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });

        // 4. Update Memory & Notify
        if (result.exitCode === 0) {
            this.memory.updateDocument('test_coverage', {
                unit_tests: 'PASSED',
                report: result.stdout
            });

            this.memory.updateAgentContext(this.role, {
                currently_working_on: 'idle',
                next_tasks: []
            });

            this.eventBus.emit(EventType.UNIT_TESTS_PASSING, this.role, {
                summary: 'Sandbox tests passed.',
                details: result.stdout
            });
        } else {
            this.emitFailure('test_run', `Sandbox tests failed. Exit: ${result.exitCode}, Error: ${result.stderr}`);
        }
    }
}
