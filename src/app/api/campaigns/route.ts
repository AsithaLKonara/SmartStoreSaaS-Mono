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
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      const status = searchParams.get('status');
      
      // Organization scoping
      const orgId = getOrganizationScope(user);

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (type) where.type = type;
      if (status) where.status = status;

      const campaigns = await prisma.sms_campaigns.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Campaigns fetched',
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
      const { name, type, message, scheduledFor } = body;

      if (!name || !type || !message) {
        throw new ValidationError('Name, type, and message are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const campaign = await prisma.sms_campaigns.create({
        data: {
          organizationId,
          name,
          type,
          message,
          status: 'DRAFT',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          sentCount: 0,
          failedCount: 0,
          deliveredCount: 0
        }
      });

      logger.info({
        message: 'Campaign created',
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
