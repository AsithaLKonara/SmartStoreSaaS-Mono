import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { CRMService } from './crm.service';

export interface CustomerHealth {
    customerId: string;
    score: number; // 0 to 100
    segment: 'VIP' | 'LOYAL' | 'AT_RISK' | 'CHURNED';
    reason: string;
}

export class CRMAutopilotService {
    /**
     * Analyze customer base and identify retention opportunities
     */
    static async analyzeCustomerBase(organizationId: string): Promise<CustomerHealth[]> {
        const customers = await prisma.customer.findMany({
            where: { organizationId },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        const results: CustomerHealth[] = [];

        for (const customer of customers) {
            const health = this.calculateHealth(customer);
            if (health.segment === 'AT_RISK') {
                results.push(health);
            }
        }

        return results;
    }

    private static calculateHealth(customer: any): CustomerHealth {
        const orders = customer.orders || [];
        if (orders.length === 0) {
            return { customerId: customer.id, score: 0, segment: 'CHURNED', reason: 'No orders found' };
        }

        const lastOrderDate = orders[0].createdAt;
        const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);

        // Simple heuristic: > 60 days since last order = AT_RISK
        if (daysSinceLastOrder > 60 && daysSinceLastOrder < 180) {
            return {
                customerId: customer.id,
                score: 40,
                segment: 'AT_RISK',
                reason: `Last purchase was ${Math.floor(daysSinceLastOrder)} days ago.`
            };
        }

        if (daysSinceLastOrder >= 180) {
            return { customerId: customer.id, score: 10, segment: 'CHURNED', reason: 'Inactive for > 6 months' };
        }

        if (orders.length > 5) {
            return { customerId: customer.id, score: 90, segment: 'VIP', reason: 'Highly active frequent buyer' };
        }

        return { customerId: customer.id, score: 70, segment: 'LOYAL', reason: 'Consistent behavior' };
    }

    /**
     * Execute retention actions for at-risk customers
     */
    static async runRetentionCampaigns(organizationId: string) {
        const atRisk = await this.analyzeCustomerBase(organizationId);

        for (const customer of atRisk) {
            if (customer.segment === 'AT_RISK') {
                await CRMService.sendCampaign({
                    organizationId,
                    name: 'Retention - AI Autopilot',
                    type: 'EMAIL',
                    content: `Hi! We noticed you haven't visited us in a while. Here is a 15% discount for your next order: WELCOMEBACK15`
                });

                logger.info({
                    message: 'Retention campaign sent by AI',
                    context: { customerId: customer.customerId }
                });
            }
        }

        return { processed: atRisk.length };
    }
}
