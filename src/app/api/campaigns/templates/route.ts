/**
 * Campaign Templates API Route
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
 * GET /api/campaigns/templates
 * Get campaign templates
 */
export const GET = requirePermission('VIEW_CAMPAIGNS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const templates = await prisma.sms_templates.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Campaign templates fetched',
        context: {
          count: templates.length,
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(templates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch campaign templates',
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
        message: 'Failed to fetch campaign templates',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/campaigns/templates
 * Create campaign template
 */
export const POST = requirePermission('MANAGE_CAMPAIGNS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, content, type } = body;

      if (!name || !content) {
        throw new ValidationError('Name and content are required', {
          fields: { name: !name, content: !content }
        });
      }

      const template = await prisma.sms_templates.create({
        data: {
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          name,
          content,
          variables: null,
          isActive: true,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Campaign template created',
        context: {
          templateId: template.id,
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(template), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create campaign template',
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
        message: 'Failed to create campaign template',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
