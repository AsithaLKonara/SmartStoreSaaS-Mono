import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class PricingService {
    /**
     * Calculate pricing for a set of items
     */
    static async calculateOrderPricing(params: {
        organizationId: string;
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
        }>;
        couponCode?: string;
        customerId?: string;
    }) {
        const { organizationId, items, couponCode, customerId } = params;

        // 1. Fetch product details
        const productIds = items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                organizationId
            }
        });

        // 2. Map items to include current prices
        const itemDetails = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            const price = Number(product.price);
            return {
                ...item,
                price,
                total: price * item.quantity
            };
        });

        // 3. Calculate subtotal
        const subtotal = itemDetails.reduce((sum, item) => sum + item.total, 0);

        // 4. TODO: Apply coupon logic
        let discount = 0;
        if (couponCode) {
            // Placeholder for coupon validation
            logger.info({ message: 'Coupon applied (placeholder)', context: { couponCode } });
        }

        // 5. Calculate Tax (Placeholder for 10% tax rate)
        const taxRate = 0.10;
        const tax = (subtotal - discount) * taxRate;

        // 6. Final Calculation
        const total = subtotal - discount + tax;

        return {
            itemDetails,
            subtotal,
            tax,
            discount,
            total,
            currency: 'LKR' // Default currency
        };
    }

    /**
     * Update a product's price (AI Dynamic Pricing Support)
     */
    static async updateProductPrice(params: {
        productId: string;
        organizationId: string;
        newPrice: number;
        reason?: string;
        updatedBy?: 'human' | 'ai';
    }) {
        const { productId, organizationId, newPrice, reason, updatedBy = 'human' } = params;

        return prisma.$transaction(async (tx) => {
            const product = await tx.product.update({
                where: { id: productId, organizationId },
                data: {
                    price: newPrice,
                    updatedByOrigin: updatedBy,
                }
            });

            // Log the price change activity
            await tx.productActivity.create({
                data: {
                    productId,
                    type: 'PRICE_UPDATE',
                    description: `Price updated to ${newPrice} (Source: ${updatedBy})${reason ? `: ${reason}` : ''}`,
                    metadata: { oldPrice: (product.price as unknown as number), newPrice, updatedBy }
                }
            });

            return product;
        });
    }
}
