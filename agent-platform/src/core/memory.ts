import { IStorageAdapter } from './storage';
export interface LivingDocument {
    version: string;
    summary: string;
    full_url: string;
    last_modified_by: string;
    hash?: string;
    [key: string]: any; // Allow extensibility
}

export interface CodeArtifact {
    structure_summary: string;
    entry_points: string[];
    repository_url: string;
    file_tree_hash?: string;
    generated_code?: string;
}

export interface AgentContextPointer {
    currently_working_on: string;
    next_tasks: string[];
    needs_from_others: string[];
}

export interface ProjectMemoryState {
    project_id: string;
    owner_id?: string; // Optional for backward compatibility, required for new projects
    project_name?: string;
    current_phase: 'ideation' | 'requirements' | 'design' | 'development' | 'testing' | 'deployment';

    state_snapshot: {
        last_updated: Date;
        active_agents: string[];
        blockers: string[];
        completed_milestones: string[];
    };

    living_documents: {
        requirements?: LivingDocument;
        system_design?: LivingDocument;
        ux_design?: {
            figma_url: string;
            design_system_url: string;
            summary: string;
        };
        api_contracts?: {
            version: string;
            summary: string;
            openapi_spec: string;
        };
        [key: string]: any;
    };

    code_artifacts: {
        frontend?: CodeArtifact;
        backend?: CodeArtifact;
        [key: string]: any;
    };

    agent_context_pointers: {
        [agent_role: string]: AgentContextPointer;
    };

    knowledge_base: {
        guidelines: Array<{
            trigger: string;
            condition: string;
            rule: string;
        }>;
    };
}

export class ProjectMemory {
    private storage: IStorageAdapter;
    private state: ProjectMemoryState;

    constructor(projectId: string, storage: IStorageAdapter) {
        this.storage = storage;
        this.state = {
            project_id: projectId,
            current_phase: 'ideation',
            state_snapshot: {
                last_updated: new Date(),
                active_agents: [],
                blockers: [],
                completed_milestones: []
            },
            living_documents: {},
            code_artifacts: {},
            agent_context_pointers: {},
            knowledge_base: {
                guidelines: []
            }
        };
    }

    getSnapshot(): ProjectMemoryState {
        return JSON.parse(JSON.stringify(this.state));
    }

    updatePhase(phase: ProjectMemoryState['current_phase']) {
        this.state.current_phase = phase;
        this.touch();
    }

    updateProjectName(name: string) {
        this.state.project_name = name;
        this.touch();
    }

    updateDocument(docType: string, data: any) {
        this.state.living_documents[docType] = {
            ...this.state.living_documents[docType],
            ...data
        };
        this.touch();
    }

    updateCodeArtifact(artifactType: string, data: any) {
        this.state.code_artifacts[artifactType] = {
            ...this.state.code_artifacts[artifactType],
            ...data
        };
        this.touch();
    }

    updateAgentContext(agentRole: string, context: Partial<AgentContextPointer>) {
        if (!this.state.agent_context_pointers[agentRole]) {
            this.state.agent_context_pointers[agentRole] = {
                currently_working_on: '',
                next_tasks: [],
                needs_from_others: []
            };
        }
        this.state.agent_context_pointers[agentRole] = {
            ...this.state.agent_context_pointers[agentRole],
            ...context
        };
        this.touch();
    }

    addGuideline(guideline: { trigger: string; condition: string; rule: string }) {
        this.state.knowledge_base.guidelines.push(guideline);
        this.touch();
    }

    private touch() {
        this.state.state_snapshot.last_updated = new Date();
        this.save();
    }

    private async save() {
        await this.storage.save(this.state);
    }

    public async load(projectId?: string, userId?: string) {
        const idToLoad = projectId || this.state.project_id;
        const loadedState = await this.storage.load(idToLoad, userId);
        if (loadedState) {
            this.state = loadedState;
            console.log(`[Memory] State loaded for project: ${idToLoad}`);
        } else if (projectId) {
            // If switching to a new ID that doesn't exist, we might want to error or init empty?
            // For now, let's assume we only switch to existing projects from the list.
            console.warn(`[Memory] No state found for project: ${projectId}`);
        }
    }

    public setOwner(userId: string) {
        this.state.owner_id = userId;
        this.touch();
    }
}
