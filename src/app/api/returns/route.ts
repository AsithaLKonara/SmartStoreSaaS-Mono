/**
 * Returns API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (VIEW_RETURNS permission)
 * - POST: CUSTOMER can create returns for own orders
 * - PATCH: SUPER_ADMIN, TENANT_ADMIN (MANAGE_RETURNS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrganizationScope, requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get('customerId');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');

      // Organization scoping
      const orgId = getOrganizationScope(user);
      
      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;

      // CUSTOMER can only see their own returns
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (customer) {
          where.customerId = customer.id;
        }
      }

      const returns = await prisma.return.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Returns fetched',
        context: { userId: user.id, count: returns.length }
      });

      return NextResponse.json(successResponse(returns));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch returns',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, items, notes, refundMethod } = body;

      if (!orderId || !items || !Array.isArray(items)) {
        throw new ValidationError('Order ID and items are required');
      }

      // Verify order exists and belongs to user's organization
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (!customer || order.customerId !== customer.id) {
          throw new ValidationError('Cannot create returns for other customers orders');
        }
      }

      const returnNumber = `RET-${Date.now()}`;

      const returnRequest = await prisma.return.create({
        data: {
          returnNumber,
          orderId,
          customerId: order.customerId,
          organizationId: order.organizationId,
          reason: notes || '',
          status: 'PENDING',
          refundMethod: refundMethod || 'ORIGINAL_PAYMENT',
          refundAmount: 0
        }
      });

      logger.info({
        message: 'Return request created',
        context: { userId: user.id, returnId: returnRequest.id, orderId }
      });

      return NextResponse.json(successResponse(returnRequest), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create return',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PATCH = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { returnId, action, notes, reason } = body;

      if (!returnId || !action) {
        throw new ValidationError('Return ID and action are required');
      }

      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId }
      });

      if (!returnRequest) {
        throw new ValidationError('Return request not found');
      }

      // Verify belongs to user's organization
      if (returnRequest.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot modify returns from other organizations');
      }

      let updated;

      switch (action) {
        case 'approve':
          updated = await prisma.return.update({
            where: { id: returnId },
            data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: user.id }
          });
          break;
        case 'reject':
          if (!reason) throw new ValidationError('Reason required for rejection');
          updated = await prisma.return.update({
            where: { id: returnId },
            data: { status: 'REJECTED', reason }
          });
          break;
        case 'received':
          updated = await prisma.return.update({
            where: { id: returnId },
            data: { status: 'RECEIVED' }
          });
          break;
        case 'refund':
          updated = await prisma.return.update({
            where: { id: returnId },
            data: { status: 'REFUNDED' }
          });
          break;
        default:
          throw new ValidationError('Invalid action');
      }

      logger.info({
        message: `Return ${action} processed`,
        context: { userId: user.id, returnId, action }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update return',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
