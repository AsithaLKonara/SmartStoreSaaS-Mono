/**
 * Procurement Suppliers API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPLIERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
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

      const suppliers = await prisma.supplier.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Procurement suppliers fetched',
        context: { userId: user.id, count: suppliers.length }
      });

      return NextResponse.json(successResponse(suppliers));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement suppliers',
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
      const { name, contactName, email, phone } = body;

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
          name,
          contactName,
          email,
          phone,
          isActive: true
        }
      });

      logger.info({
        message: 'Procurement supplier created',
        context: { userId: user.id, supplierId: supplier.id }
      });

      return NextResponse.json(successResponse(supplier), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create procurement supplier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

