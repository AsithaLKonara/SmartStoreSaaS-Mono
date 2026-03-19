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
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { sriLankaCourierService } from '@/lib/courier/sriLankaCourierService';


export const dynamic = 'force-dynamic';

/**
 * GET /api/courier/integrations
 * Get courier integrations (VIEW_INTEGRATIONS permission)
 */
export const GET = requirePermission(Permission.INTEGRATIONS_MANAGE)(
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

      // Fetch actual courier integrations
      const integrations = await sriLankaCourierService.getAvailableServices();

      return NextResponse.json(successResponse({
        integrations,
        count: integrations.length
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch courier integrations',
        error: error instanceof Error ? error.message : String(error),
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
export const POST = requirePermission(Permission.INTEGRATIONS_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { courierName, courierCode, apiKey, baseUrl, config } = body;

      if (!courierName || !courierCode) {
        throw new ValidationError('Courier name and code are required');
      }

      logger.info({
        message: 'Courier integration requested',
        context: {
          userId: user.id,
          organizationId,
          courierName
        },
        correlation: req.correlationId
      });

      // Create actual courier integration using service
      await sriLankaCourierService.addCourier({
        name: courierName,
        code: courierCode,
        apiKey: apiKey || 'mock-key',
        baseUrl: baseUrl || 'https://api.courier.lk',
        isActive: true,
        organizationId
      });

      return NextResponse.json(successResponse({
        courierCode,
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