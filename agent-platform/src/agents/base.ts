import { ProjectMemory } from '../core/memory';
import { AgentEvent, EventType } from '../core/events';
import { IEventBus } from '../core/event_bus_adapters';
import { LLMService } from '../core/llm';

export interface AgentContext {
    project_phase: string;
    my_current_task: any;
    relevant_artifacts: any;
    active_blockers: string[];
    guidelines: any[];
}

export abstract class BaseAgent {
    public role: string;
    protected memory: ProjectMemory;
    protected eventBus: IEventBus;
    protected llm: LLMService;

    constructor(role: string, memory: ProjectMemory, eventBus: IEventBus, llm: LLMService) {
        this.role = role;
        this.memory = memory;
        this.eventBus = eventBus;
        this.llm = llm;
    }

    abstract initialize(): void;

    // Returns true if the agent did some work
    abstract act(): Promise<boolean>;

    protected getContext(): AgentContext {
        // Simplified context retrieval
        const snapshot = this.memory.getSnapshot();
        return {
            project_phase: snapshot.current_phase,
            my_current_task: snapshot.agent_context_pointers[this.role],
            relevant_artifacts: this.getRelevantArtifacts(snapshot),
            active_blockers: snapshot.state_snapshot.blockers,
            guidelines: snapshot.knowledge_base?.guidelines || [] // Inject learned rules
        } as any;
    }

    protected emitFailure(action: string, error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Action Failed: ${action} - ${errorMessage}`);

        this.eventBus.emit(EventType.ACTION_FAILED, this.role, {
            action,
            error: errorMessage
        });
    }

    protected abstract getRelevantArtifacts(snapshot: any): any;

    // --- Decentralized Tracking ---

    protected getLogPath(): string {
        const path = require('path');
        const fs = require('fs');
        const snapshot = this.memory.getSnapshot();
        const logsDir = path.join(process.cwd(), 'output', snapshot.project_id, 'logs');

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        return path.join(logsDir, `${this.role}.md`);
    }

    protected log(message: string) {
        const fs = require('fs');
        const logFile = this.getLogPath();
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `\n- [${timestamp}] ${message}`;

        // Ensure file exists with header
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, `# ${this.role.toUpperCase()} Log\n\n## Activity Log`);
        }

        fs.appendFileSync(logFile, logEntry);
        console.log(`[${this.role}] ${message}`); // Keep console echo
    }

    protected updateChecklist(items: string[]) {
        const fs = require('fs');
        const logFile = this.getLogPath();

        let content = '';
        if (fs.existsSync(logFile)) {
            content = fs.readFileSync(logFile, 'utf-8');
        } else {
            content = `# ${this.role.toUpperCase()} Log\n\n## Activity Log`;
        }

        const checklistMd = `\n\n## Current Checklist\n` + items.map(item => `- [ ] ${item}`).join('\n');
        fs.appendFileSync(logFile, checklistMd);
    }

    protected replacePlaceholders(template: string, variables: Record<string, string>): string {
        return template.replace(/{{(\w+)}}/g, (_, key) => variables[key] || '');
    }

    protected extractCodeBlock(response: string): string | null {
        const match = response.match(/```(?:\w+)?\s*([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }
}
