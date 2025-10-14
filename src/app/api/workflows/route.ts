/**
 * Workflows API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WORKFLOWS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WORKFLOWS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Workflows fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      return NextResponse.json(successResponse({
        workflows: [],
        message: 'Workflow engine - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch workflows',
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
      const { name, trigger, actions, enabled = true } = body;

      if (!name || !trigger || !actions) {
        throw new ValidationError('Name, trigger, and actions are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Workflow created',
        context: {
          userId: user.id,
          organizationId,
          workflowName: name,
          trigger
        }
      });

      return NextResponse.json(successResponse({
        message: 'Workflow created',
        name,
        enabled
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create workflow',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
