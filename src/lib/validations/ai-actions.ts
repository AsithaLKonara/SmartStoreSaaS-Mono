import { z } from 'zod';

export const AIActionSchema = z.discriminatedUnion('action', [
    // 1. Create Purchase Order
    z.object({
        action: z.literal('CREATE_PURCHASE_ORDER'),
        payload: z.object({
            supplierId: z.string().cuid(),
            items: z.array(z.object({
                productId: z.string().cuid(),
                quantity: z.number().positive(),
                unitCost: z.number().nonnegative(),
            })),
            notes: z.string().optional(),
        }),
    }),

    // 2. Update Product Price
    z.object({
        action: z.literal('UPDATE_PRODUCT_PRICE'),
        payload: z.object({
            productId: z.string().cuid(),
            newPrice: z.number().positive(),
            reason: z.string().optional(),
        }),
    }),

    // 3. Create Order
    z.object({
        action: z.literal('CREATE_ORDER'),
        payload: z.object({
            customerId: z.string().cuid(),
            items: z.array(z.object({
                productId: z.string().cuid(),
                quantity: z.number().positive(),
                price: z.number().positive(),
            })),
            notes: z.string().optional(),
        }),
    }),

    // 4. Send Campaign
    z.object({
        action: z.literal('SEND_CAMPAIGN'),
        payload: z.object({
            name: z.string(),
            type: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
            content: z.string(),
            segmentId: z.string().cuid().optional(),
        }),
    }),

    // 5. Get Analytics
    z.object({
        action: z.literal('GET_ANALYTICS'),
        payload: z.object({
            type: z.enum(['STORE_SUMMARY', 'SALES_PERFORMANCE']),
            days: z.number().optional(),
        }),
    }),
]);

export type AIAction = z.infer<typeof AIActionSchema>;
