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
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/campaigns
 * List marketing campaigns
 */
export const GET = requirePermission('VIEW_CAMPAIGNS')(
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
        prisma.sms_campaigns.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            sms_templates: {
              select: { name: true, content: true }
            }
          }
        }),
        prisma.sms_campaigns.count({ where })
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
export const POST = requirePermission('MANAGE_CAMPAIGNS')(
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

      // TODO: Implement actual campaign creation logic
      // This would typically involve:
      // 1. Validating campaign data
      // 2. Creating campaign record in database
      // 3. Scheduling campaign if scheduledAt is provided
      // 4. Setting up tracking and analytics

      const campaign = {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        subject,
        content,
        recipientList: recipientList || [],
        scheduledAt: scheduledAt || null,
        templateId: templateId || null,
        status: scheduledAt ? 'scheduled' : 'draft',
        organizationId,
        createdAt: new Date().toISOString()
      };

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