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
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/affiliates
 * Get affiliates (VIEW_AFFILIATES permission)
 */
export const GET = requirePermission('VIEW_AFFILIATES')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');

      const where: any = { organizationId };
      if (status) where.status = status;

      const affiliates = await prisma.affiliate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Affiliates fetched',
        context: {
          userId: user.id,
          organizationId,
          count: affiliates.length,
          status
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(affiliates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch affiliates',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch affiliates',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/affiliates
 * Create affiliate (MANAGE_AFFILIATES permission)
 */
export const POST = requirePermission('MANAGE_AFFILIATES')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, email, commissionRate } = body;

      if (!name || !email) {
        throw new ValidationError('Name and email are required', {
          fields: { name: !name, email: !email }
        });
      }

      const code = `AFF-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        context: {
          userId: user.id,
          organizationId,
          affiliateId: affiliate.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(affiliate), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create affiliate',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create affiliate',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
