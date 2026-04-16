/**
 * Referrals API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_MARKETING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_MARKETING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/referrals
 * Get referrals
 */
export const GET = requirePermission(Permission.MARKETING_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const customerId = searchParams.get('customerId');

      // Build where clause
      const where: any = { organizationId };
      if (customerId) where.referrerId = customerId;

      // Query referrals from database (using affiliate or create referral tracking)
      const [referrals, total] = await Promise.all([
        prisma.affiliate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            status: true,
            commissionRate: true,
            totalSales: true,
            totalCommission: true,
            createdAt: true
          }
        }),
        prisma.affiliate.count({ where })
      ]);

      logger.info({
        message: 'Referrals fetched successfully',
        context: {
          userId: user.id,
          organizationId,
          count: referrals.length,
          total,
          customerId,
          page,
          limit
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(referrals, {
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          note: 'Using affiliate system for referral tracking'
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch referrals',
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
        message: 'Failed to fetch referrals',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/marketing/referrals
 * Create referral
 */
export const POST = requirePermission(Permission.MARKETING_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { referrerId, refereeEmail, refereeName } = body;

      // Validate required fields
      if (!referrerId || !refereeEmail) {
        throw new ValidationError('Missing required fields: referrerId, refereeEmail', {
          fields: { referrerId: !referrerId, refereeEmail: !refereeEmail }
        });
      }

      const referral = await prisma.affiliate.create({
        data: {
          code: `REF-${Date.now().toString(36).toUpperCase()}`,
          name: refereeName || refereeEmail.split('@')[0],
          email: refereeEmail,
          organizationId,
          status: 'ACTIVE',
          commissionRate: 10,
        }
      });

      logger.info({
        message: 'Referral created',
        context: {
          userId: user.id,
          referrerId,
          refereeEmail,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(referral), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create referral',
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
        message: 'Failed to create referral',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);