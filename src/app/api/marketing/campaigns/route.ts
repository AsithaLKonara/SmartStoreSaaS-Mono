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
 * GET /api/marketing/campaigns
 * List marketing campaigns
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
      const status = searchParams.get('status');
      const type = searchParams.get('type');

      // Build where clause
      const where: any = { organizationId };
      if (status) where.status = status;

      // Query SMS campaigns from database
      const [campaigns, total] = await Promise.all([
        prisma.smsCampaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            template: {
              select: { name: true, content: true }
            }
          }
        }),
        prisma.smsCampaign.count({ where })
      ]);

      logger.info({
        message: 'Marketing campaigns fetched successfully',
        context: {
          userId: user.id,
          organizationId,
          count: campaigns.length,
          total,
          status,
          type,
          page,
          limit
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(campaigns, {
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch marketing campaigns',
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
        message: 'Failed to fetch marketing campaigns',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/marketing/campaigns
 * Create marketing campaign
 */
export const POST = requirePermission(Permission.MARKETING_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, type, subject, content, recipientList, scheduledAt, templateId } = body;

      // Validate required fields
      if (!name || !type || !subject || !content) {
        throw new ValidationError('Missing required fields: name, type, subject, content', {
          fields: {
            name: !name,
            type: !type,
            subject: !subject,
            content: !content
          }
        });
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          name,
          subject,
          content,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
          organizationId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          recipientCount: recipientList ? recipientList.length : 0,
        }
      });

      logger.info({
        message: 'Marketing campaign created',
        context: {
          userId: user.id,
          name,
          type,
          recipientCount: recipientList?.length || 0,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(campaign), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create marketing campaign',
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
        message: 'Failed to create marketing campaign',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);