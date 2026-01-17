
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { AgentEvent, EventType, EventHandler } from './events';

export interface IEventBus {
    subscribe(eventType: EventType, handler: EventHandler): void;
    emit(type: EventType, emitted_by: string, payload: any): Promise<AgentEvent>;
}

export class InMemoryEventBus implements IEventBus {
    private listeners: Map<EventType, EventHandler[]> = new Map();

    subscribe(eventType: EventType, handler: EventHandler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)?.push(handler);
    }

    async emit(type: EventType, emitted_by: string, payload: any): Promise<AgentEvent> {
        const event: AgentEvent = {
            id: uuidv4(),
            type,
            emitted_by,
            payload,
            timestamp: new Date()
        };

        const handlers = this.listeners.get(type) || [];
        // Execute handlers for in-memory (synchronously or largely so)
        handlers.forEach(handler => handler(event));

        console.log(`[InMemoryBus] Emitted ${type} by ${emitted_by}`);
        return event;
    }
}

export class RedisEventBus implements IEventBus {
    private publisher: Redis;
    private subscriber: Redis;
    private listeners: Map<EventType, EventHandler[]> = new Map();
    private nodeId: string;

    constructor(redisUrl: string) {
        this.publisher = new Redis(redisUrl);
        this.subscriber = new Redis(redisUrl);
        this.nodeId = uuidv4();

        // Listen for all events
        this.subscriber.psubscribe('agent-platform:*', (err, count) => {
            if (err) console.error('[RedisBus] Failed to subscribe', err);
            else console.log(`[RedisBus] Subscribed to ${count} channels.`);
        });

        this.subscriber.on('pmessage', (pattern, channel, message) => {
            try {
                const event: AgentEvent = JSON.parse(message);
                // Rehydrate date
                event.timestamp = new Date(event.timestamp);

                this.handleIncomingEvent(event);
            } catch (e) {
                console.error('[RedisBus] Failed to parse message', e);
            }
        });
    }

    subscribe(eventType: EventType, handler: EventHandler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)?.push(handler);
    }

    async emit(type: EventType, emitted_by: string, payload: any): Promise<AgentEvent> {
        const event: AgentEvent = {
            id: uuidv4(),
            type,
            emitted_by,
            payload,
            timestamp: new Date()
        };

        const channel = `agent-platform:${type}`;
        await this.publisher.publish(channel, JSON.stringify(event));

        console.log(`[RedisBus] Published ${type} to ${channel}`);
        return event;
    }

    private handleIncomingEvent(event: AgentEvent) {
        const handlers = this.listeners.get(event.type) || [];
        handlers.forEach(handler => handler(event));
    }
}
