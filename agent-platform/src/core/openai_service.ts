
import OpenAI from 'openai';
import { LLMService, LLMMessage } from './llm';
import * as fs from 'fs';
import * as path from 'path';

export class OpenAILLMService implements LLMService {
    private client: OpenAI;
    private cache: Map<string, string> = new Map();
    private cacheFile: string = path.join(process.cwd(), 'llm_cache.json');

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
        this.loadCache();
    }

    private loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try {
                const data = fs.readFileSync(this.cacheFile, 'utf-8');
                const json = JSON.parse(data);
                this.cache = new Map(Object.entries(json));
                console.log(`[OpenAI] Loaded ${this.cache.size} cached responses.`);
            } catch (e) {
                console.error('[OpenAI] Failed to load cache', e);
            }
        }
    }

    private saveCache() {
        try {
            const obj = Object.fromEntries(this.cache);
            fs.writeFileSync(this.cacheFile, JSON.stringify(obj, null, 2));
        } catch (e) {
            console.error('[OpenAI] Failed to save cache', e);
        }
    }

    async generateText(messages: LLMMessage[], systemPrompt?: string): Promise<string> {
        // Create a cache key based on the last user message (simplified for demo)
        // In production, hash the entire conversation
        const lastMsg = messages[messages.length - 1].content;
        const cacheKey = Buffer.from(lastMsg).toString('base64');

        if (this.cache.has(cacheKey)) {
            console.log(`[OpenAI] Cache Hit for: "${lastMsg.substring(0, 30)}..."`);
            return this.cache.get(cacheKey)!;
        }

        console.log(`[OpenAI] Calling API for: "${lastMsg.substring(0, 30)}..."`);

        const formattedMessages: any[] = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        if (systemPrompt) {
            formattedMessages.unshift({ role: 'system', content: systemPrompt });
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: formattedMessages,
                model: 'gpt-4o-mini', // Cost effective
                temperature: 0.7,
            });

            const content = completion.choices[0].message.content || 'Error: No content generated';

            // Update Cache
            this.cache.set(cacheKey, content);
            this.saveCache();

            return content;
        } catch (error) {
            console.error('[OpenAI] API Error:', error);
            return 'Error: OpenAI API call failed. Check your API Key.';
        }
    }
}
