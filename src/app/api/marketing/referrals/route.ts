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
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/referrals
 * Get referrals
 */
export const GET = requirePermission('VIEW_MARKETING')(
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
export const POST = requirePermission('MANAGE_MARKETING')(
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

      // TODO: Implement actual referral creation logic
      // This would typically involve:
      // 1. Validating referrer exists
      // 2. Checking if referee already exists
      // 3. Creating referral record
      // 4. Sending referral email/SMS
      // 5. Setting up tracking

      const referral = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerId,
        refereeEmail,
        refereeName: refereeName || null,
        status: 'pending',
        rewardAmount: 0.00,
        organizationId,
        createdAt: new Date().toISOString(),
        completedAt: null
      };

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