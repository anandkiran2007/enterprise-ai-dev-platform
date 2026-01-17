
import { v4 as uuidv4 } from 'uuid';

export enum EventType {
    // Requirements & Planning
    // Requirements & Planning
    USER_IDEA_SUBMITTED = "user_idea_submitted",
    REQUIREMENTS_READY = "requirements_ready", // Internal or deprecated for auto-flow
    REQUIREMENTS_REVIEW_NEEDED = "requirements_review_needed",
    REQUIREMENTS_APPROVED = "requirements_approved",
    REQUIREMENTS_CHANGED = "requirements_changed",

    // Design
    UX_DESIGN_READY = "ux_design_ready",
    DESIGN_SYSTEM_UPDATED = "design_system_updated",
    SYSTEM_ARCHITECTURE_READY = "system_architecture_ready",

    // Development
    API_CONTRACT_DEFINED = "api_contract_defined",
    API_CONTRACT_CHANGED = "api_contract_changed",
    FRONTEND_COMPONENT_READY = "frontend_component_ready",
    BACKEND_ENDPOINT_READY = "backend_endpoint_ready",
    BFF_LAYER_READY = "bff_layer_ready",

    // Testing
    UNIT_TESTS_PASSING = "unit_tests_passing",
    INTEGRATION_TESTS_PASSING = "integration_tests_passing",
    E2E_TESTS_READY = "e2e_tests_ready",

    // Blockers & Requests
    BLOCKER_RAISED = "blocker_raised",
    CLARIFICATION_NEEDED = "clarification_needed",
    DEPENDENCY_REQUEST = "dependency_request",

    // Reinforcement Learning
    ACTION_FAILED = "action_failed",
    QUALITY_CHECK_FAILED = "quality_check_failed",
    NEW_GUIDELINE = "new_guideline"
}

export interface AgentEvent {
    id: string;
    type: EventType;
    emitted_by: string; // Agent ID
    payload: any;
    timestamp: Date;
}

export type EventHandler = (event: AgentEvent) => void;

export class EventBus {
    private listeners: Map<EventType, EventHandler[]> = new Map();

    subscribe(eventType: EventType, handler: EventHandler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)?.push(handler);
    }

    emit(type: EventType, emitted_by: string, payload: any) {
        const event: AgentEvent = {
            id: uuidv4(),
            type,
            emitted_by,
            payload,
            timestamp: new Date()
        };

        const handlers = this.listeners.get(type) || [];
        handlers.forEach(handler => handler(event));

        console.log(`[EventBus] Emitted ${type} by ${emitted_by}`);
        return event;
    }
}
