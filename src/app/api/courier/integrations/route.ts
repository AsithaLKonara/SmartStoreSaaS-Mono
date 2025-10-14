/**
 * Courier Integrations API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_COURIER_INTEGRATIONS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_COURIER_INTEGRATIONS permission)
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
        message: 'Courier integrations fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch actual courier integrations
      return NextResponse.json(successResponse({
        integrations: [],
        message: 'Courier integrations - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch courier integrations',
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
      const { courier, apiKey, apiSecret } = body;

      if (!courier || !apiKey) {
        throw new ValidationError('Courier and API key are required');
      }

      logger.info({
        message: 'Courier integration created',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          courier
        }
      });

      // TODO: Create actual courier integration
      return NextResponse.json(successResponse({
        integrationId: `courier_${Date.now()}`,
        courier,
        status: 'active'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create courier integration',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
