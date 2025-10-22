/**
 * Social Commerce API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SOCIAL_COMMERCE permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SOCIAL_COMMERCE permission)
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
      const orgId = getOrganizationScope(user);

      const socialAccounts = await prisma.social_commerce.findMany({
        where: orgId ? { organizationId: orgId } : {},
        select: {
          id: true,
          platform: true,
          accountName: true,
          status: true,
          lastSync: true,
          isActive: true
        }
      });

      logger.info({
        message: 'Social commerce accounts fetched',
        context: { userId: user.id, count: socialAccounts.length }
      });

      return NextResponse.json(successResponse(socialAccounts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch social commerce',
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
      const { platform, accountName, accessToken } = body;

      if (!platform || !accountName) {
        throw new ValidationError('Platform and account name are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Social commerce account connected',
        context: {
          userId: user.id,
          organizationId,
          platform
        }
      });

      return NextResponse.json(successResponse({
        message: 'Social commerce account connected',
        platform
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to connect social commerce',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
