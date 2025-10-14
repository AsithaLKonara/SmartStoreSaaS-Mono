/**
 * Single Procurement Purchase Order API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PURCHASE_ORDERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PURCHASE_ORDERS permission)
 * 
 * Organization Scoping: Validated through purchase order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const poId = params.id;

      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { supplier: true }
      });

      if (!purchaseOrder) {
        throw new ValidationError('Purchase order not found');
      }

      if (purchaseOrder.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view purchase orders from other organizations');
      }

      logger.info({
        message: 'Purchase order fetched',
        context: { userId: user.id, poId }
      });

      return NextResponse.json(successResponse(purchaseOrder));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch purchase order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const poId = params.id;
      const body = await request.json();

      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: poId }
      });

      if (!purchaseOrder) {
        throw new ValidationError('Purchase order not found');
      }

      if (purchaseOrder.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update purchase orders from other organizations');
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id: poId },
        data: body
      });

      logger.info({
        message: 'Purchase order updated',
        context: { userId: user.id, poId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update purchase order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
