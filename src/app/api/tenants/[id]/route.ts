/**
 * Single Tenant API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_TENANTS permission)
 * - PUT: SUPER_ADMIN only (MANAGE_TENANTS permission)
 * - DELETE: SUPER_ADMIN only (MANAGE_TENANTS permission)
 * 
 * System-wide: Organization management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const tenantId = params.id;

      const tenant = await prisma.organization.findUnique({
        where: { id: tenantId },
        include: {
          _count: {
            select: { users: true, products: true, orders: true }
          }
        }
      });

      if (!tenant) {
        throw new ValidationError('Tenant not found');
      }

      logger.info({
        message: 'Tenant fetched',
        context: { userId: user.id, tenantId }
      });

      return NextResponse.json(successResponse(tenant));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch tenant',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole('SUPER_ADMIN')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const tenantId = params.id;
      const body = await request.json();

      const tenant = await prisma.organization.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new ValidationError('Tenant not found');
      }

      const updated = await prisma.organization.update({
        where: { id: tenantId },
        data: body
      });

      logger.info({
        message: 'Tenant updated',
        context: { userId: user.id, tenantId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update tenant',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole('SUPER_ADMIN')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const tenantId = params.id;

      const tenant = await prisma.organization.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new ValidationError('Tenant not found');
      }

      await prisma.organization.delete({
        where: { id: tenantId }
      });

      logger.info({
        message: 'Tenant deleted',
        context: { userId: user.id, tenantId }
      });

      return NextResponse.json(successResponse({
        message: 'Tenant deleted',
        tenantId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete tenant',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
