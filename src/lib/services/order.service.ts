import { prisma } from '@/lib/prisma';
import { User, Order, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class OrderService {
    /**
     * Get orders with scoping and pagination
     */
    static async getOrders(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        status?: string;
        customerId?: string;
    }) {
        const { organizationId, page = 1, limit = 20, status, customerId } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    sku: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single order by ID
     */
    static async getOrderById(id: string, organizationId: string) {
        return prisma.order.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                payments: true,
                deliveries: true,
            },
        });
    }

    /**
     * Create a new order with items
     */
    static async createOrder(data: {
        customerId: string;
        organizationId: string;
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
            price: number;
        }>;
        subtotal: number;
        tax?: number;
        shipping?: number;
        discount?: number;
        total: number;
        notes?: string;
        createdById?: string;
        origin?: 'human' | 'ai';
    }) {
        const {
            customerId,
            organizationId,
            items,
            subtotal,
            tax = 0,
            shipping = 0,
            discount = 0,
            total,
            notes,
            createdById,
            origin = 'human',
        } = data;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        return prisma.$transaction(async (tx) => {
            // 1. Create the order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId,
                    organizationId,
                    subtotal,
                    tax,
                    shipping,
                    discount,
                    total,
                    notes,
                    status: 'PENDING',
                    createdById,
                    createdByOrigin: origin,
                },
            });

            // 2. Create order items
            if (items && items.length > 0) {
                await tx.orderItem.createMany({
                    data: items.map((item) => ({
                        orderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.price * item.quantity,
                    })),
                });
            }

            return tx.order.findUnique({
                where: { id: order.id },
                include: {
                    customer: true,
                    orderItems: true,
                },
            });
        });
    }

    /**
     * Update order status
     */
    static async updateStatus(params: {
        orderId: string;
        organizationId: string;
        status: string;
        notes?: string;
        origin?: 'human' | 'ai';
    }) {
        const { orderId, organizationId, status, notes, origin = 'human' } = params;

        return prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id: orderId, organizationId },
                data: {
                    status,
                    updatedByOrigin: origin,
                },
            });

            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    status,
                    notes,
                },
            });

            return order;
        });
    }
}
