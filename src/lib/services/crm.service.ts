import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export class CRMService {
    /**
     * List customers with scoping and pagination
     */
    static async getCustomers(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const { organizationId, page = 1, limit = 20, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {
            organizationId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.customer.count({ where }),
        ]);

        return {
            customers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Create a new customer
     */
    static async createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
        address?: any;
        organizationId: string;
        origin?: 'human' | 'ai';
    }) {
        const { origin = 'human', ...customerData } = data;
        return prisma.customer.create({
            data: {
                ...customerData,
                createdByOrigin: origin,
            },
        });
    }

    /**
     * Update loyalty points (AI Retention Support)
     */
    static async updateLoyaltyPoints(params: {
        customerId: string;
        points: number;
        description: string;
        type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
    }) {
        const { customerId, points, description, type } = params;

        return prisma.$transaction(async (tx) => {
            // 1. Get or create loyalty profile
            let loyalty = await tx.customerLoyalty.findFirst({
                where: { customerId }
            });

            if (!loyalty) {
                loyalty = await tx.customerLoyalty.create({
                    data: {
                        customerId,
                        points: 0,
                        tier: 'BRONZE'
                    }
                });
            }

            // 2. Update points
            const newPoints = type === 'REDEEMED' ? loyalty.points - points : loyalty.points + points;

            const updatedLoyalty = await tx.customerLoyalty.update({
                where: { id: loyalty.id },
                data: {
                    points: newPoints,
                    lastActivity: new Date()
                }
            });

            // 3. Log transaction
            await tx.loyaltyTransaction.create({
                data: {
                    id: uuidv4(),
                    customerId,
                    loyaltyId: loyalty.id,
                    type,
                    points,
                    description
                }
            });

            return updatedLoyalty;
        });
    }

    /**
     * Send marketing campaign (Placeholder for integration)
     */
    static async sendCampaign(params: {
        organizationId: string;
        name: string;
        type: 'SMS' | 'WHATSAPP' | 'EMAIL';
        content: string;
        segmentId?: string;
    }) {
        const { organizationId, name, type, content, segmentId } = params;

        logger.info({
            message: 'Marketing campaign initiated',
            context: { organizationId, name, type, segmentId }
        });

        // logic for actual dispatch goes here

        return {
            success: true,
            campaignId: `cmp-${Date.now()}`,
            status: 'SENT'
        };
    }
}
