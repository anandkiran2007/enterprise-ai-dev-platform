import { BaseAgent } from './base';
import { EventType } from '../core/events';

export class TeacherAgent extends BaseAgent {

    initialize() {
        console.log('[Teacher Agent] Watching for failures...');

        // Listen for failures
        this.eventBus.subscribe(EventType.ACTION_FAILED, async (event) => {
            console.log(`[Teacher Agent] Detected failure from ${event.emitted_by}: ${event.payload.error}`);
            await this.analyzeFailure(event.emitted_by, event.payload.action, event.payload.error);
        });
    }

    protected getRelevantArtifacts(snapshot: any) {
        return {
            guidelines: snapshot.knowledge_base.guidelines
        };
    }

    async act(): Promise<boolean> {
        return false; // Reactive only
    }

    private async analyzeFailure(agentRole: string, action: string, error: string) {
        this.log(`Analyzing failure: ${action} failed with "${error}"`);

        // Ask LLM to deduce a guideline
        const prompt = `
        A software agent (${agentRole}) failed to perform action "${action}".
        Error message: "${error}".
        
        As a Teacher, analyze this error. If it is a repeatable mistake (like file size too big, syntax error, missing dependency), 
        create a general guideline for all agents to follow to prevent this in the future.
        
        Format output as JSON:
        {
            "trigger": "when performing action...",
            "condition": "if condition...",
            "rule": "perform this check first..."
        }
        `;

        try {
            const { AGENT_PROMPTS } = require('../core/prompts');
            const response = await this.llm.generateText([
                { role: 'system', content: AGENT_PROMPTS.teacher },
                { role: 'user', content: prompt }
            ]);

            // Attempt to parse JSON (simple heuristic)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const guideline = JSON.parse(jsonMatch[0]);

                this.memory.addGuideline(guideline);
                this.log(`New Guideline Created: ${guideline.rule}`);

                this.eventBus.emit(EventType.NEW_GUIDELINE, this.role, {
                    guideline: guideline
                });
            } else {
                this.log(`Could not derive a structured guideline from LLM response.`);
            }

        } catch (e) {
            console.error('[Teacher Agent] Failed to analyze failure', e);
        }
    }
}
