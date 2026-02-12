/**
 * Invoice Payment API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (PAY_INVOICES permission)
 * 
 * Organization Scoping: Validated through invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, AppError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/invoices/[id]/pay
 * Pay invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const invoiceId = resolvedParams.id;

  const handler = requirePermission('MANAGE_BILLING')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { paymentMethod, amount } = body;

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId }
        });

        if (!invoice) {
          throw new AppError('Invoice not found', 'ERR_NOT_FOUND', 404);
        }

        if (invoice.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          throw new AppError('Cannot pay invoices for other organizations', 'ERR_FORBIDDEN', 403);
        }

        if (invoice.status === 'PAID') {
          throw new AppError('Invoice is already paid', 'ERR_VALIDATION', 400);
        }

        // Ideally, here we would integrate with Stripe/PayPal to process the payment
        // For now, we update the status directly

        const paidInvoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            metadata: {
              ...(invoice.metadata as object || {}),
              paymentMethod,
              paidBy: user.id
            }
          }
        });

        logger.info({
          message: 'Invoice payment processed',
          context: {
            userId: user.id,
            invoiceId,
            amount: paidInvoice.amount,
            paymentMethod,
            organizationId: user.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          invoiceId,
          status: 'paid',
          paidAt: paidInvoice.paidAt,
          paymentMethod
        }));
      } catch (error: any) {
        logger.error({
          message: 'Invoice payment failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            invoiceId
          },
          correlation: correlationId
        });

        if (error instanceof ValidationError || error instanceof AppError) {
          throw error;
        }

        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Invoice payment failed',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}
