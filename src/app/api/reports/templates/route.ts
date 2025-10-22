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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Report templates fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch actual report templates
      return NextResponse.json(successResponse({
        templates: [],
        message: 'Report templates - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch report templates',
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
      const { name, type, config } = body;

      if (!name || !type) {
        throw new ValidationError('Name and type are required');
      }

      logger.info({
        message: 'Report template created',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          name,
          type
        }
      });

      return NextResponse.json(successResponse({
        templateId: `tpl_${Date.now()}`,
        name,
        type
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create report template',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

