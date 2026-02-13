import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, AuthenticatedRequest, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { AIActionSchema } from '@/lib/validations/ai-actions';
import { OrderService } from '@/lib/services/order.service';
import { PricingService } from '@/lib/services/pricing.service';
import { SupplierService } from '@/lib/services/supplier.service';
import { CRMService } from '@/lib/services/crm.service';
import { AnalyticsService } from '@/lib/services/analytics.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/actions
 * Central gateway for AI-driven business operations
 */
export const POST = requirePermission('MANAGE_AI')(
    async (req: AuthenticatedRequest, user) => {
        const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

        try {
            const body = await req.json();
            const validation = AIActionSchema.safeParse(body);

            if (!validation.success) {
                throw new ValidationError('Invalid AI Action payload', validation.error.format());
            }

            const { action, payload } = validation.data;
            const organizationId = getOrganizationScope(user);

            if (!organizationId) {
                throw new AuthorizationError('Organization scoping required for AI actions');
            }

            let result;

            logger.info({
                message: 'AI Action Gateway: Executing',
                context: { action, organizationId, userId: user.id },
                correlation: correlationId
            });

            switch (action) {
                case 'CREATE_PURCHASE_ORDER':
                    result = await SupplierService.createPurchaseOrder({
                        ...payload,
                        organizationId,
                        createdById: user.id,
                        origin: 'ai'
                    });
                    break;

                case 'UPDATE_PRODUCT_PRICE':
                    result = await PricingService.updateProductPrice({
                        ...payload,
                        organizationId,
                        updatedBy: 'ai'
                    });
                    break;

                case 'CREATE_ORDER':
                    // Calculate pricing first via service
                    const pricing = await PricingService.calculateOrderPricing({
                        items: payload.items,
                        customerId: payload.customerId,
                        organizationId
                    });

                    result = await OrderService.createOrder({
                        ...payload,
                        organizationId,
                        subtotal: pricing.subtotal,
                        tax: pricing.tax,
                        total: pricing.total,
                        createdById: user.id,
                        origin: 'ai'
                    });
                    break;

                case 'SEND_CAMPAIGN':
                    result = await CRMService.sendCampaign({
                        ...payload,
                        organizationId
                    });
                    break;

                case 'GET_ANALYTICS':
                    if (payload.type === 'STORE_SUMMARY') {
                        result = await AnalyticsService.getStoreAnalytics(organizationId);
                    } else {
                        result = await AnalyticsService.getSalesPerformance(organizationId, payload.days);
                    }
                    break;

                default:
                    throw new ValidationError(`Unsupported AI action: ${action}`);
            }

            return NextResponse.json(successResponse(result, {
                action,
                executedBy: 'ai-gateway',
                correlation: correlationId
            }));

        } catch (error: any) {
            logger.error({
                message: 'AI Action Gateway: Execution failed',
                error: error instanceof Error ? error : new Error(String(error)),
                context: { userId: user.id },
                correlation: correlationId
            });

            if (error instanceof ValidationError || error instanceof AuthorizationError) {
                throw error;
            }

            return NextResponse.json({
                success: false,
                code: 'ERR_AI_GATEWAY',
                message: 'AI action execution failed',
                correlation: correlationId
            }, { status: 500 });
        }
    }
);
