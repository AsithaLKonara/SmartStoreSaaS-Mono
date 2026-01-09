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
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/procurement/purchase-orders
 * Get purchase orders
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Procurement purchase orders fetched',
        context: {
          userId: user.id,
          organizationId,
          count: purchaseOrders.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(purchaseOrders));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement purchase orders',
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
        message: 'Failed to fetch procurement purchase orders',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/procurement/purchase-orders
 * Create purchase order
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { supplierId, items, expectedDelivery } = body;

      if (!supplierId || !items) {
        throw new ValidationError('Supplier ID and items are required', {
          fields: { supplierId: !supplierId, items: !items }
        });
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
        context: {
          userId: user.id,
          organizationId,
          poId: po.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(po), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create purchase order',
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
        message: 'Failed to create purchase order',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

