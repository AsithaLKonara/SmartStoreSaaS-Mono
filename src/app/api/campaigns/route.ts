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
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * List campaigns
 */
export const GET = requirePermission(Permission.MARKETING_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type');
      const status = searchParams.get('status');

      const where: any = { organizationId };
      if (type) where.type = type;
      if (status) where.status = status;

      const campaigns = await prisma.smsCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Campaigns fetched',
        context: {
          userId: user.id,
          organizationId,
          count: campaigns.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(campaigns));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch campaigns',
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
        message: 'Failed to fetch campaigns',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/campaigns
 * Create campaign
 */
export const POST = requirePermission(Permission.MARKETING_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, type, message, scheduledFor } = body;

      if (!name || !type || !message) {
        throw new ValidationError('Name, type, and message are required', {
          fields: { name: !name, type: !type, message: !message }
        });
      }

      // Create template and campaign in a transaction
      const campaign = await prisma.$transaction(async (tx) => {
        const templateId = `template_${Date.now()}`;
        
        // 1. Create the template first
        await tx.smsTemplate.create({
          data: {
            id: templateId,
            name: `Template for ${name}`,
            content: message,
            organizationId,
            isActive: true,
            updatedAt: new Date()
          }
        });

        // 2. Create the campaign
        return tx.smsCampaign.create({
          data: {
            id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId,
            name,
            templateId: templateId,
            status: 'DRAFT',
            scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
            updatedAt: new Date()
          }
        });
      });

      logger.info({
        message: 'Campaign created with template',
        context: {
          userId: user.id,
          campaignId: campaign.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(campaign), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create campaign',
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
        message: 'Failed to create campaign',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
