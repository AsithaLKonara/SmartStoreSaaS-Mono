/**
 * Single Inventory Item API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
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
      const inventoryId = params.id;

      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        include: { product: true }
      });

      if (!inventory) {
        throw new ValidationError('Inventory item not found');
      }

      if (inventory.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view inventory from other organizations');
      }

      logger.info({
        message: 'Inventory item fetched',
        context: { userId: user.id, inventoryId }
      });

      return NextResponse.json(successResponse(inventory));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch inventory item',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const inventoryId = params.id;
      const body = await request.json();

      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId }
      });

      if (!inventory) {
        throw new ValidationError('Inventory item not found');
      }

      if (inventory.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update inventory from other organizations');
      }

      const updated = await prisma.inventory.update({
        where: { id: inventoryId },
        data: body
      });

      logger.info({
        message: 'Inventory item updated',
        context: { userId: user.id, inventoryId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update inventory item',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
