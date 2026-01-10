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
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/procurement/invoices
 * Get procurement invoices
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const invoices = await prisma.procurementInvoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Procurement invoices fetched',
        context: {
          userId: user.id,
          organizationId,
          count: invoices.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(invoices));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement invoices',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch procurement invoices',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/procurement/invoices
 * Create procurement invoice
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { purchaseOrderId, amount, dueDate } = body;

      if (!purchaseOrderId || !amount) {
        throw new ValidationError('Purchase order ID and amount are required', {
          fields: { purchaseOrderId: !purchaseOrderId, amount: !amount }
        });
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
        context: {
          userId: user.id,
          organizationId,
          invoiceId: invoice.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(invoice), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create procurement invoice',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create procurement invoice',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

