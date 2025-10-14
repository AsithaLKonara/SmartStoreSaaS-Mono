/**
 * Affiliates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AFFILIATES permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_AFFILIATES permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      
      // Organization scoping
      const orgId = getOrganizationScope(user);

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;

      const affiliates = await prisma.affiliate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Affiliates fetched',
        context: { userId: user.id, count: affiliates.length }
      });

      return NextResponse.json(successResponse(affiliates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch affiliates',
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
      const { name, email, commissionRate } = body;

      if (!name || !email) {
        throw new ValidationError('Name and email are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const code = `AFF-${Date.now()}`;

      const affiliate = await prisma.affiliate.create({
        data: {
          code,
          name,
          email,
          commissionRate: commissionRate || 10,
          status: 'PENDING',
          organizationId,
          totalSales: 0,
          totalCommission: 0
        }
      });

      logger.info({
        message: 'Affiliate created',
        context: { userId: user.id, affiliateId: affiliate.id }
      });

      return NextResponse.json(successResponse(affiliate), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create affiliate',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
