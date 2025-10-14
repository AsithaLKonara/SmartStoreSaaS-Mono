/**
 * Single Warehouse API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_WAREHOUSES permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WAREHOUSES permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WAREHOUSES permission)
 * 
 * Organization Scoping: Required
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
      const warehouseId = params.id;

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
      });

      if (!warehouse) {
        throw new ValidationError('Warehouse not found');
      }

      if (warehouse.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view warehouses from other organizations');
      }

      logger.info({
        message: 'Warehouse fetched',
        context: { userId: user.id, warehouseId }
      });

      return NextResponse.json(successResponse(warehouse));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch warehouse',
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
      const warehouseId = params.id;
      const body = await request.json();

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
      });

      if (!warehouse) {
        throw new ValidationError('Warehouse not found');
      }

      if (warehouse.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update warehouses from other organizations');
      }

      const updated = await prisma.warehouse.update({
        where: { id: warehouseId },
        data: body
      });

      logger.info({
        message: 'Warehouse updated',
        context: { userId: user.id, warehouseId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update warehouse',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const warehouseId = params.id;

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
      });

      if (!warehouse) {
        throw new ValidationError('Warehouse not found');
      }

      if (warehouse.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete warehouses from other organizations');
      }

      await prisma.warehouse.delete({
        where: { id: warehouseId }
      });

      logger.info({
        message: 'Warehouse deleted',
        context: { userId: user.id, warehouseId }
      });

      return NextResponse.json(successResponse({
        message: 'Warehouse deleted',
        warehouseId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete warehouse',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
