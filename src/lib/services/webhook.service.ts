import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export class WebhookService {
    /**
     * Trigger all webhooks registered for a specific event in an organization
     */
    static async trigger(params: {
        organizationId: string;
        event: string;
        payload: any;
    }) {
        const { organizationId, event, payload } = params;

        // 1. Fetch active webhooks for this event
        const webhooks = await prisma.webhookSubscription.findMany({
            where: {
                organizationId,
                isActive: true,
                events: {
                    has: event
                }
            }
        });

        if (webhooks.length === 0) return;

        logger.info({
            message: 'Triggering webhooks',
            context: { organizationId, event, count: webhooks.length }
        });

        // 2. Dispatch events (Async via Promise.allSettled)
        const dispatches = webhooks.map(webhook =>
            this.dispatch(webhook.url, webhook.secret, event, payload).catch(err => {
                logger.error({
                    message: 'Webhook dispatch failed',
                    error: err instanceof Error ? err : new Error(String(err)),
                    context: { webhookId: webhook.id, event, url: webhook.url }
                });
            })
        );

        // We don't await dispatches in the main flow to avoid blocking, 
        // but if this is a background process we might want to.
        Promise.allSettled(dispatches);
    }

    private static async dispatch(url: string, secret: string | null, event: string, payload: any) {
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(payload, secret, timestamp);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Event': event,
                'X-Webhook-Timestamp': timestamp,
                'X-Webhook-Signature': signature
            },
            body: JSON.stringify(payload),
            // Timeout after 10 seconds
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with status ${response.status}`);
        }
    }

    private static generateSignature(payload: any, secret: string | null, timestamp: string): string {
        if (!secret) return 'unsigned';

        const hmac = crypto.createHmac('sha256', secret);
        const data = `${timestamp}.${JSON.stringify(payload)}`;
        return hmac.update(data).digest('hex');
    }

    /**
     * Manage subscriptions
     */
    static async createSubscription(data: {
        organizationId: string;
        name: string;
        url: string;
        events: string[];
        secret?: string;
    }) {
        return prisma.webhookSubscription.create({
            data
        });
    }

    static async getSubscriptions(organizationId: string) {
        return prisma.webhookSubscription.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async deleteSubscription(id: string, organizationId: string) {
        return prisma.webhookSubscription.deleteMany({
            where: { id, organizationId }
        });
    }
}
