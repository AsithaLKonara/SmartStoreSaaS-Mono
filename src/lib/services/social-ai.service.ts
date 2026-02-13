import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { ProductDiscoveryService } from './product-discovery.service';

export class SocialAIService {
    /**
     * Process an incoming message from any social channel
     */
    static async handleIncomingMessage(params: {
        channel: 'whatsapp' | 'instagram' | 'web';
        senderId: string;
        message: string;
        organizationId: string;
    }) {
        const { channel, senderId, message, organizationId } = params;

        // 1. Get or create conversation record
        const conversation = await this.getOrCreateConversation(senderId, channel, organizationId);

        // 2. Persist the incoming message
        await prisma.channelMessage.create({
            data: {
                conversationId: conversation.id,
                channel,
                message,
                isIncoming: true,
                status: 'RECEIVED'
            }
        });

        // 3. AI Processing: Search for products if the user is asking for them
        // This is a "Small Brain" logic to decide if we need product context
        const productsMatch = await this.detectProductIntent(message, organizationId);

        // 4. Consult Orchestrator with Conversation Context
        const aiContext = {
            channel,
            history: await this.getHistory(conversation.id),
            detectedProducts: productsMatch
        };

        const aiResponse = await AIOrchestrator.handleChatQuery(organizationId, 'ai-agent', message);

        // 5. Persist the AI's reply
        await prisma.channelMessage.create({
            data: {
                conversationId: conversation.id,
                channel,
                message: aiResponse.answer,
                isIncoming: false,
                status: 'SENT'
            }
        });

        return aiResponse.answer;
    }

    private static async getOrCreateConversation(senderId: string, channel: string, organizationId: string) {
        let conv = await prisma.customerConversation.findFirst({
            where: { sessionId: senderId, organizationId }
        });

        if (!conv) {
            conv = await prisma.customerConversation.create({
                data: {
                    sessionId: senderId,
                    channel,
                    organizationId,
                    status: 'active'
                }
            });
        }

        return conv;
    }

    private static async getHistory(conversationId: string, limit: number = 5) {
        return prisma.channelMessage.findMany({
            where: { conversationId },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    }

    private static async detectProductIntent(message: string, organizationId: string) {
        // Basic heuristic: if message contains "have", "price", "buy", "stock"
        const lower = message.toLowerCase();
        if (lower.includes('have') || lower.includes('price') || lower.includes('buy') || lower.includes('stock')) {
            // extract words that might be products (naive)
            const words = lower.split(' ').filter(w => w.length > 3);
            // try to match any word
            for (const word of words) {
                const matches = await ProductDiscoveryService.findProducts({ query: word, organizationId });
                if (matches.length > 0) return matches;
            }
        }
        return [];
    }
}
