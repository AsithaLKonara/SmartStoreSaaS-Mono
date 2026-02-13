import { logger } from '@/lib/logger';

export interface AIContext {
    inventory: any[];
    salesVelocity: any;
    leadTimes?: any;
    analytics: any;
}

export interface AIResponse {
    action: string;
    data: any;
    reason: string;
}

export class AIBrainService {
    private static readonly API_URL = process.env.HUGGINGFACE_MODEL_URL || 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
    private static readonly API_KEY = process.env.HUGGINGFACE_API_KEY;

    /**
     * Send context to the model and get the next logical action
     */
    static async decideNextAction(context: AIContext): Promise<AIResponse> {
        if (!this.API_KEY) {
            logger.warn('HUGGINGFACE_API_KEY is not set. Falling back to mock decision.');
            return this.getMockDecision(context);
        }

        try {
            const prompt = this.buildPrompt(context);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        return_full_text: false,
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`HF API error: ${response.statusText}`);
            }

            const raw = await response.json();
            const output = raw[0]?.generated_text || '';

            return this.parseModelOutput(output);
        } catch (error) {
            logger.error({
                message: 'AI Brain decision failed',
                error: error instanceof Error ? error : new Error(String(error))
            });
            return this.getMockDecision(context);
        }
    }

    private static buildPrompt(context: AIContext): string {
        return `[INST] You are the brain of an AI-Native Retail OS.
Analyze the following store data and decide on a single best action.
RETURN ONLY JSON in the following format:
{
  "action": "ACTION_NAME",
  "data": { ... },
  "reason": "..."
}

DATA:
${JSON.stringify(context, null, 2)}
[/INST]`;
    }

    private static parseModelOutput(output: string): AIResponse {
        try {
            // Find JSON block in output
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in model output');
        } catch (e) {
            logger.error({ message: 'Failed to parse AI output', output });
            throw e;
        }
    }

    private static getMockDecision(context: AIContext): AIResponse {
        // Basic heuristic for low stock
        const lowStockItem = context.inventory?.find((p: any) => p.stock <= p.minStock);

        if (lowStockItem) {
            return {
                action: 'CREATE_PURCHASE_ORDER',
                data: {
                    productId: lowStockItem.id,
                    quantity: Math.max(50, lowStockItem.minStock * 2),
                    supplierId: lowStockItem.supplierId || 'default-supplier'
                },
                reason: `Item ${lowStockItem.sku} is low on stock (${lowStockItem.stock} remaining)`
            };
        }

        return {
            action: 'NONE',
            data: {},
            reason: 'All systems stable'
        };
    }
}
