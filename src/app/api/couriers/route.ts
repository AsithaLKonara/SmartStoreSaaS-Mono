/**
 * Couriers API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_COURIERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_COURIERS permission)
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
      const orgId = getOrganizationScope(user);

      const couriers = await prisma.courier.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Couriers fetched',
        context: { userId: user.id, count: couriers.length }
      });

      return NextResponse.json(successResponse(couriers));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch couriers',
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
      const { name, contactName, phone, email } = body;

      if (!name) {
        throw new ValidationError('Courier name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const courier = await prisma.courier.create({
        data: {
          organizationId,
          name,
          contactName,
          phone,
          email,
          isActive: true
        }
      });

      logger.info({
        message: 'Courier created',
        context: { userId: user.id, courierId: courier.id }
      });

      return NextResponse.json(successResponse(courier), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create courier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
