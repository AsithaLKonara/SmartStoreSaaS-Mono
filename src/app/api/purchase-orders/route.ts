/**
 * Purchase Orders API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PROCUREMENT permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PROCUREMENT permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      
      // Organization scoping
      const orgId = getOrganizationScope(user);

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Purchase orders fetched',
        context: { userId: user.id, count: purchaseOrders.length }
      });

      return NextResponse.json(successResponse(purchaseOrders));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch purchase orders',
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
      const { supplierId, items, expectedDate, notes } = body;

      if (!supplierId || !items || items.length === 0) {
        throw new ValidationError('Supplier ID and items are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Verify supplier belongs to organization
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId }
      });

      if (!supplier) {
        throw new ValidationError('Supplier not found');
      }

      const orderNumber = `PO-${Date.now()}`;
      
      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (item.unitPrice * item.quantity), 0
      );
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId,
          organizationId,
          createdBy: user.id,
          status: 'DRAFT',
          orderDate: new Date(),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          subtotal,
          tax,
          shipping: 0,
          total,
          notes
        }
      });

      logger.info({
        message: 'Purchase order created',
        context: {
          userId: user.id,
          poId: purchaseOrder.id,
          orderNumber,
          total
        }
      });

      return NextResponse.json(successResponse(purchaseOrder), { status: 201 });
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
