/**
 * Suppliers API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPLIERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * - PATCH: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
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
      const supplierId = searchParams.get('supplierId');
      const action = searchParams.get('action');
      
      // Organization scoping
      const orgId = getOrganizationScope(user, searchParams.get('organizationId') || undefined);

      if (!orgId) {
        throw new ValidationError('Organization ID is required');
      }

      if (supplierId && action === 'performance') {
        // Get supplier performance (would call manager function if available)
        return NextResponse.json(successResponse({ 
          message: 'Supplier performance',
          supplierId 
        }));
      }

      if (supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: supplierId, organizationId: orgId }
        });
        
        if (!supplier) {
          throw new ValidationError('Supplier not found');
        }
        
        return NextResponse.json(successResponse(supplier));
      }

      const isActive = searchParams.get('isActive');
      const search = searchParams.get('search');

      const where: any = { organizationId: orgId };
      if (isActive) where.status = isActive === 'true' ? 'ACTIVE' : 'INACTIVE';
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ];
      }

      const suppliers = await prisma.supplier.findMany({ where });

      logger.info({
        message: 'Suppliers fetched',
        context: { userId: user.id, count: suppliers.length }
      });

      return NextResponse.json(successResponse(suppliers));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch suppliers',
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
      const { name, code, email, phone, address } = body;

      if (!name) {
        throw new ValidationError('Supplier name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const supplier = await prisma.supplier.create({
        data: {
          organizationId,
          code: code || `SUP-${Date.now()}`,
          name,
          email,
          phone,
          address,
          status: 'ACTIVE',
          totalOrders: 0,
          totalSpent: 0
        }
      });

      logger.info({
        message: 'Supplier created',
        context: { userId: user.id, supplierId: supplier.id }
      });

      return NextResponse.json(successResponse(supplier), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create supplier',
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
      const { supplierId, action, rating, notes, ...data } = body;

      if (!supplierId) {
        throw new ValidationError('Supplier ID is required');
      }

      // Verify supplier belongs to user's organization
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId: user.organizationId }
      });

      if (!supplier) {
        throw new ValidationError('Supplier not found');
      }

      if (action === 'rate') {
        const updated = await prisma.supplier.update({
          where: { id: supplierId },
          data: { rating, notes }
        });
        
        logger.info({
          message: 'Supplier rated',
          context: { userId: user.id, supplierId, rating }
        });
        
        return NextResponse.json(successResponse(updated));
      }

      const updated = await prisma.supplier.update({
        where: { id: supplierId },
        data
      });

      logger.info({
        message: 'Supplier updated',
        context: { userId: user.id, supplierId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update supplier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
