/**
 * POS Transactions API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_POS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_POS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pos/transactions
 * Get POS transactions
 */
export const GET = requirePermission(Permission.ORDER_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const transactions = await prisma.posTransaction.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'POS transactions fetched',
        context: {
          userId: user.id,
          organizationId,
          count: transactions.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(transactions));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch POS transactions',
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
        message: 'Failed to fetch POS transactions',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/pos/transactions
 * Create POS transaction
 */
export const POST = requirePermission(Permission.ORDER_UPDATE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { terminalId, items, total, paymentMethod } = body;

      if (!terminalId || !items || !total) {
        throw new ValidationError('Terminal ID, items, and total are required', {
          fields: { terminalId: !terminalId, items: !items, total: !total }
        });
      }

      const transaction = await prisma.posTransaction.create({
        data: {
          organizationId: organizationId as string,
          terminalId,
          itemsJson: items,
          total,
          paymentMethod: paymentMethod || 'CASH',
          cashierId: user.id,
          status: 'COMPLETED',
          transactionItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.quantity * item.price
            }))
          }
        },
        include: {
          transactionItems: true
        }
      });

      logger.info({
        message: 'POS transaction created',
        context: {
          userId: user.id,
          organizationId,
          transactionId: transaction.id,
          total
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(transaction), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create POS transaction',
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
        message: 'Failed to create POS transaction',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

