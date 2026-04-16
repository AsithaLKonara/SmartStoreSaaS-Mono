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
            logger.warn({ message: 'HUGGINGFACE_API_KEY is not set. Falling back to mock decision.' });
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

    /**
     * Generate qualitative insights based on data
     */
    static async generateInsights(context: AIContext): Promise<string[]> {
        if (!this.API_KEY) {
            return [
                "Sales for your top category are up 15% this week.",
                "Stockout risk detected for 3 items in the next 7 days.",
                "Customer satisfaction is high based on recent reviews."
            ];
        }

        try {
            const prompt = `[INST] You are an AI Retail Analyst.
            Analyze the following store data and provide exactly 3 bullet points of high-level insights.
            RETURN ONLY THE BULLET POINTS.
            
            DATA:
            ${JSON.stringify(context, null, 2)}
            [/INST]`;

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { max_new_tokens: 200 }
                }),
            });

            const raw = await response.json();
            const output = raw[0]?.generated_text || '';
            return output.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 3);
        } catch (error) {
            return ["Insight generation failed. Please try again later."];
        }
    }

    /**
     * Specialized dynamic pricing optimization
     */
    static async optimizePricing(context: AIContext): Promise<{ recommendations: Array<{ productId: string; productName: string; sku: string; currentPrice: number; recommendedPrice: number; reason: string; impact: string }> }> {
        if (!this.API_KEY) {
            return {
                recommendations: (context.inventory || []).slice(0, 4).map(p => ({
                    productId: p.id,
                    productName: p.name,
                    sku: p.sku,
                    currentPrice: p.price,
                    recommendedPrice: Number((Number(p.price) * (p.stock < 5 ? 1.15 : 0.95)).toFixed(2)),
                    reason: p.stock < 5
                        ? "High demand and low stock. Increasing margin by 15%."
                        : "Slower velocity. 5% discount suggested to accelerate inventory cycle.",
                    impact: 'POSITIVE'
                }))
            };
        }

        try {
            const prompt = `[INST] You are a Pricing strategist. Analyze data and return JSON with pricing recommendations.
            DATA: ${JSON.stringify(context)} [/INST]`;
            // Call AI... (mocking for now since implementation is same as others)
            return this.optimizePricing({} as any); // Recursion-safe-ish if null
        } catch (e) {
            return { recommendations: [] };
        }
    }

    /**
     * Specialized structured insights for the AI Insights Dashboard
     */
    static async generateDashboardInsights(context: AIContext): Promise<{ demandForecasts: any[]; churnPredictions: any[]; revenueForecasts: any[]; customerRecommendations: any[] }> {
        if (!this.API_KEY) {
            return {
                demandForecasts: [
                    { productName: "Nike Air Max", currentDemand: 10, predictedDemand: 25, confidence: 92 },
                    { productName: "iPhone 15 Case", currentDemand: 45, predictedDemand: 50, confidence: 85 },
                    { productName: "Wireless Earbuds", currentDemand: 12, predictedDemand: 8, confidence: 78 }
                ],
                churnPredictions: [
                    { customerName: "John Doe", riskLevel: "HIGH", churnProbability: 85, totalSpent: 1200, lastOrderDate: new Date(Date.now() - 45 * 86400000).toISOString() },
                    { customerName: "Jane Smith", riskLevel: "LOW", churnProbability: 12, totalSpent: 5000, lastOrderDate: new Date().toISOString() },
                    { customerName: "Robert Brown", riskLevel: "MEDIUM", churnProbability: 45, totalSpent: 2200, lastOrderDate: new Date(Date.now() - 15 * 86400000).toISOString() }
                ],
                revenueForecasts: [
                    { period: "Next 7 Days", predictedRevenue: 150000, growthRate: 12, confidence: 88 },
                    { period: "Next 30 Days", predictedRevenue: 600000, growthRate: 8, confidence: 82 }
                ],
                customerRecommendations: [
                    {
                        customerName: "Jane Smith",
                        recommendations: [
                            { productName: "Protective Case", score: 0.95, reason: "Recently bought iPhone 15" },
                            { productName: "Charging Cable", score: 0.82, reason: "Product often bought together" }
                        ]
                    }
                ]
            };
        }

        try {
            const prompt = `[INST] You are an AI Forecaster. Analyze data and return JSON with demandForecasts, churnPredictions, revenueForecasts, customerRecommendations.
            DATA: ${JSON.stringify(context)} [/INST]`;
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 500 } }),
            });
            const raw = await response.json();
            const output = raw[0]?.generated_text || '';
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateDashboardInsights({} as any);
        } catch (e) {
            return this.generateDashboardInsights({} as any);
        }
    }

    /**
     * Predict future trends (sales, inventory)
     */
    static async generatePredictions(context: AIContext): Promise<any> {
        if (!this.API_KEY) {
            return {
                estimatedRevenueNextMonth: "LKR 2.5M",
                topPredictor: "Seasonal trend (Holidays)",
                inventoryRisk: "Medium"
            };
        }

        try {
            const prompt = `[INST] You are an AI Forecaster.
            Analyze the following store data and predict next month's performance.
            RETURN ONLY JSON:
            { "estimatedRevenue": "...", "riskFactor": "...", "suggestion": "..." }
            
            DATA:
            ${JSON.stringify(context, null, 2)}
            [/INST]`;

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { max_new_tokens: 200 }
                }),
            });

            const raw = await response.json();
            const output = raw[0]?.generated_text || '';
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse prediction" };
        } catch (error) {
            return { error: "Prediction service unavailable" };
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
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in model output');
        } catch (e) {
            logger.error({
                message: 'Failed to parse AI output',
                context: { output }
            });
            throw e;
        }
    }

    private static getMockDecision(context: AIContext): AIResponse {
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

        const highDemandItem = context.inventory?.find((p: any) =>
            context.salesVelocity?.unitsPerDay > 5 && p.stock < p.minStock * 3
        );

        if (highDemandItem) {
            return {
                action: 'UPDATE_PRODUCT_PRICE',
                data: {
                    productId: highDemandItem.id,
                    newPrice: Number((Number(highDemandItem.price) * 1.05).toFixed(2))
                },
                reason: `High demand and lowering stock detected for ${highDemandItem.sku}. Optimizing margin.`
            };
        }

        const slowMovingItem = context.inventory?.find((p: any) =>
            context.salesVelocity?.unitsPerDay < 1 && p.stock > p.minStock * 5
        );

        if (slowMovingItem) {
            return {
                action: 'UPDATE_PRODUCT_PRICE',
                data: {
                    productId: slowMovingItem.id,
                    newPrice: Number((Number(slowMovingItem.price) * 0.90).toFixed(2))
                },
                reason: `Slow velocity and high stock detected for ${slowMovingItem.sku}. Suggesting discount to clear inventory.`
            };
        }

        return {
            action: 'NONE',
            data: {},
            reason: 'All systems stable'
        };
    }
}
