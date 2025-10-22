/**
 * Procurement Invoices API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PROCUREMENT permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_PROCUREMENT permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const invoices = await prisma.procurementInvoice.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Procurement invoices fetched',
        context: { userId: user.id, count: invoices.length }
      });

      return NextResponse.json(successResponse(invoices));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement invoices',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { purchaseOrderId, amount, dueDate } = body;

      if (!purchaseOrderId || !amount) {
        throw new ValidationError('Purchase order ID and amount are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const invoice = await prisma.procurementInvoice.create({
        data: {
          organizationId,
          purchaseOrderId,
          amount,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status: 'PENDING',
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Procurement invoice created',
        context: { userId: user.id, invoiceId: invoice.id }
      });

      return NextResponse.json(successResponse(invoice), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create procurement invoice',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

