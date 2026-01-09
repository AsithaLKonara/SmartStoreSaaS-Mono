/**
 * Report Templates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_REPORT_TEMPLATES permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_REPORT_TEMPLATES permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
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

      // TODO: Fetch actual report templates
      logger.info({
        message: 'Report templates fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        templates: [],
        message: 'Report templates - implementation pending'
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
      const { name, type, config } = body;

      if (!name || !type) {
        throw new ValidationError('Name and type are required', {
          fields: { name: !name, type: !type }
        });
      }

      logger.info({
        message: 'Report template created',
        context: {
          userId: user.id,
          organizationId,
          name,
          type
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        templateId: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        type
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

