/**
 * Marketing Campaigns API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CAMPAIGNS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CAMPAIGNS permission)
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

      const campaigns = await prisma.campaign.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Marketing campaigns fetched',
        context: { userId: user.id, count: campaigns.length }
      });

      return NextResponse.json(successResponse(campaigns));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch campaigns',
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
      const { name, type, target, content } = body;

      if (!name || !type) {
        throw new ValidationError('Name and type are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const campaign = await prisma.campaign.create({
        data: {
          organizationId,
          name,
          type,
          target,
          content,
          status: 'DRAFT',
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Marketing campaign created',
        context: { userId: user.id, campaignId: campaign.id }
      });

      return NextResponse.json(successResponse(campaign), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create campaign',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
