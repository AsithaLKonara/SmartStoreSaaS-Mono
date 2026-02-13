import { prisma } from '@/lib/prisma';

export class SalesVelocityService {
    /**
     * Get units sold per day for a product over a period
     */
    static async getProductVelocity(params: {
        productId: string;
        organizationId: string;
        days?: number;
    }) {
        const { productId, organizationId, days = 30 } = params;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orderItems = await prisma.orderItem.findMany({
            where: {
                productId,
                order: {
                    organizationId,
                    createdAt: { gte: startDate },
                    status: { notIn: ['CANCELLED', 'RETURNED'] }
                }
            },
            select: {
                quantity: true
            }
        });

        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const velocity = totalQuantity / days;

        return {
            productId,
            totalSold: totalQuantity,
            periodDays: days,
            unitsPerDay: Number(velocity.toFixed(2)),
            estimatedDaysRemaining: 0 // Will be calculated by inventory service
        };
    }

    /**
     * Get velocity for all active products in an organization
     */
    static async getOrganizationVelocity(organizationId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const items = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    organizationId,
                    createdAt: { gte: startDate },
                    status: { notIn: ['CANCELLED', 'RETURNED'] }
                }
            },
            _sum: {
                quantity: true
            }
        });

        return items.map(item => ({
            productId: item.productId,
            unitsSold: item._sum.quantity || 0,
            velocity: (item._sum.quantity || 0) / days
        }));
    }
}
