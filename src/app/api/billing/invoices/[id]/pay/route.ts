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
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const invoiceId = params.id;
      const body = await request.json();
      const { paymentMethod, amount } = body;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new ValidationError('Invoice not found');
      }

      if (invoice.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot pay invoices for other organizations');
      }

      logger.info({
        message: 'Invoice payment processed',
        context: {
          userId: user.id,
          invoiceId,
          amount,
          paymentMethod
        }
      });

      // TODO: Process actual payment
      return NextResponse.json(successResponse({
        invoiceId,
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod
      }));
    } catch (error: any) {
      logger.error({
        message: 'Invoice payment failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
