import { prisma } from '@/lib/prisma';
import { User, Order, Prisma, OrderStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { OrderStateService } from '@/lib/services/order-state.service';

export class OrderService {
    /**
     * Get orders with scoping and pagination
     */
    static async getOrders(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        status?: OrderStatus;
        customerId?: string;
    }) {
        const { organizationId, page = 1, limit = 20, status, customerId } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            organizationId,
        };

        if (status) {
            where.status = status as OrderStatus;
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
                },
            });

            // 2. Process order items and update inventory
            if (items && items.length > 0) {
                for (const item of items) {
                    // Create order item
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.price * item.quantity,
                        },
                    });

                    // Update inventory atomically with boundary check (stock >= quantity) to prevent concurrent overselling
                    if (item.variantId) {
                        const updateResult = await tx.productVariant.updateMany({
                            where: { id: item.variantId, stock: { gte: item.quantity } },
                            data: { stock: { decrement: item.quantity } }
                        });

                        if (updateResult.count === 0) {
                            throw new Error(`Insufficient stock for variant: ${item.variantId}`);
                        }

                        // Log movement
                        await tx.inventoryMovement.create({
                            data: {
                                organizationId,
                                productId: item.productId,
                                variantId: item.variantId,
                                type: 'SALE',
                                quantity: -item.quantity,
                                reason: `Order #${orderNumber}`,
                                referenceId: order.id,
                                referenceType: 'ORDER'
                            }
                        });
                    } else {
                        const updateResult = await tx.product.updateMany({
                            where: { id: item.productId, stock: { gte: item.quantity } },
                            data: { stock: { decrement: item.quantity } }
                        });

                        if (updateResult.count === 0) {
                            throw new Error(`Insufficient stock for product: ${item.productId}`);
                        }

                        // Log movement
                        await tx.inventoryMovement.create({
                            data: {
                                organizationId,
                                productId: item.productId,
                                type: 'SALE',
                                quantity: -item.quantity,
                                reason: `Order #${orderNumber}`,
                                referenceId: order.id,
                                referenceType: 'ORDER'
                            }
                        });
                    }
                }
            }

            return tx.order.findUnique({
                where: { id: order.id },
                include: {
                    customer: true,
                    orderItems: {
                        include: {
                            product: true
                        }
                    },
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
        status: OrderStatus;
        notes?: string;
        origin?: 'human' | 'ai';
    }) {
        const { orderId, organizationId, status, notes, origin = 'human' } = params;

        return prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id: orderId, organizationId },
                include: { orderItems: true }
            });

            if (!currentOrder) {
                throw new Error('Order not found');
            }

            // Enforce centralized state machine transition validation
            OrderStateService.validateTransition(currentOrder.status, status);

            const isRestocking = (status === 'REFUNDED' || status === 'CANCELLED') && currentOrder.status !== status;

            if (isRestocking) {
                for (const item of currentOrder.orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }

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
