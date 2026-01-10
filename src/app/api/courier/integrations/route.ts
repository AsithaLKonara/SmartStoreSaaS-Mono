/**
 * Courier Integrations API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_INTEGRATIONS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INTEGRATIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courier/integrations
 * Get courier integrations (VIEW_INTEGRATIONS permission)
 */
export const GET = requirePermission('VIEW_INTEGRATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Courier integrations fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Fetch actual courier integrations
      return NextResponse.json(successResponse({
        integrations: [],
        message: 'Courier integrations - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch courier integrations',
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
        message: 'Failed to fetch courier integrations',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/courier/integrations
 * Create courier integration (MANAGE_INTEGRATIONS permission)
 */
export const POST = requirePermission('MANAGE_INTEGRATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { courierName, apiKey, config } = body;

      if (!courierName || !apiKey) {
        throw new ValidationError('Courier name and API key are required', {
          fields: { courierName: !courierName, apiKey: !apiKey }
        });
      }

      logger.info({
        message: 'Courier integration created',
        context: {
          userId: user.id,
          organizationId,
          courierName
        },
        correlation: req.correlationId
      });

      // TODO: Create actual courier integration
      return NextResponse.json(successResponse({
        integrationId: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courierName,
        message: 'Integration created successfully'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create courier integration',
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
        message: 'Failed to create courier integration',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);