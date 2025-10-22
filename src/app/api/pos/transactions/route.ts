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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const transactions = await prisma.posTransaction.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'POS transactions fetched',
        context: { userId: user.id, count: transactions.length }
      });

      return NextResponse.json(successResponse(transactions));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch POS transactions',
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
      const { terminalId, items, total, paymentMethod } = body;

      if (!terminalId || !items || !total) {
        throw new ValidationError('Terminal ID, items, and total are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const transaction = await prisma.posTransaction.create({
        data: {
          organizationId,
          terminalId,
          items,
          total,
          paymentMethod: paymentMethod || 'CASH',
          cashierId: user.id,
          status: 'COMPLETED'
        }
      });

      logger.info({
        message: 'POS transaction created',
        context: { userId: user.id, transactionId: transaction.id, total }
      });

      return NextResponse.json(successResponse(transaction), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create POS transaction',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

