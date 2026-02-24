/**
 * Report Templates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_REPORTS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_REPORTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/templates
 * Get report templates
 */
export const GET = requirePermission('VIEW_REPORTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const templates = await prisma.report.findMany({
        where: {
          organizationId
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Report templates fetched',
        context: {
          userId: user.id,
          organizationId,
          count: templates.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        templates: templates.map(t => ({
          ...t,
          config: t.data || {} // Map 'data' back to 'config'
        }))
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch report templates',
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
        message: 'Failed to fetch report templates',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/reports/templates
 * Create report template
 */
export const POST = requirePermission('VIEW_REPORTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, type, config, schedule } = body;

      if (!name || !type) {
        throw new ValidationError('Name and type are required', {
          fields: { name: !name, type: !type }
        });
      }

      const report = await prisma.report.create({
        data: {
          name,
          type,
          data: config ? config : null,
          schedule: schedule || null,
          organizationId,
          createdById: user.id
        }
      });

      logger.info({
        message: 'Report template created',
        context: {
          userId: user.id,
          organizationId,
          reportId: report.id,
          name,
          type
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        template: {
          ...report,
          config: config || {}
        }
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create report template',
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
        message: 'Failed to create report template',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
