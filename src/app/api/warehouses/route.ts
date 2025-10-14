/**
 * Warehouses API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope, requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requirePermission('VIEW_INVENTORY')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      
      // Organization scoping
      const orgId = getOrganizationScope(user, searchParams.get('organizationId') || undefined);

      const warehouses = await prisma.warehouses.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' }
      });

      const stats = {
        total: warehouses.length,
        active: warehouses.filter(w => w.isActive).length,
        inactive: warehouses.filter(w => !w.isActive).length
      };

      logger.info({
        message: 'Warehouses fetched',
        context: { userId: user.id, count: warehouses.length }
      });

      return NextResponse.json(successResponse({ warehouses, stats }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch warehouses',
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
      const { name, code, address, city, country, phone, email, manager } = body;

      if (!name || !code) {
        throw new ValidationError('Name and code are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const warehouse = await prisma.warehouses.create({
        data: {
          id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          name,
          code,
          address: address || '',
          city: city || '',
          country: country || '',
          phone: phone || '',
          email: email || '',
          manager: manager || '',
          isActive: true
        }
      });

      logger.info({
        message: 'Warehouse created',
        context: { userId: user.id, warehouseId: warehouse.id }
      });

      return NextResponse.json(successResponse(warehouse), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create warehouse',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
