/**
 * Referral Program API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_REFERRALS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_REFERRALS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const referrals = await prisma.referral.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Referrals fetched',
        context: { userId: user.id, count: referrals.length }
      });

      return NextResponse.json(successResponse(referrals));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch referrals',
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
      const { customerId, referredEmail, reward } = body;

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Referral created',
        context: { userId: user.id, customerId }
      });

      // TODO: Create actual referral
      return NextResponse.json(successResponse({
        referralId: `ref_${Date.now()}`,
        status: 'pending'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create referral',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
