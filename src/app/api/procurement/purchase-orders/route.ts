/**
 * Procurement Purchase Orders API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PURCHASE_ORDERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PURCHASE_ORDERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Procurement purchase orders fetched',
        context: { userId: user.id, count: purchaseOrders.length }
      });

      return NextResponse.json(successResponse(purchaseOrders));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement purchase orders',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { supplierId, items, expectedDelivery } = body;

      if (!supplierId || !items) {
        throw new ValidationError('Supplier ID and items are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Calculate subtotal and total from items
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unitPrice;
      }
      const total = subtotal; // For now, no tax/shipping calculation

      // Generate order number
      const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const po = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          organizationId,
          supplierId,
          subtotal,
          tax: 0,
          shipping: 0,
          total,
          items,
          expectedDate: expectedDelivery ? new Date(expectedDelivery) : undefined,
          status: 'DRAFT',
          createdById: user.id
        }
      });

      logger.info({
        message: 'Purchase order created',
        context: { userId: user.id, poId: po.id }
      });

      return NextResponse.json(successResponse(po), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create purchase order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

