/**
 * Tenant Switch API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_ORGANIZATIONS permission)
 * 
 * System-wide: Switch context to different tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tenants/switch
 * Switch tenant context (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { tenantId } = body;

      // Validation
      if (!tenantId) {
        throw new ValidationError('Tenant ID is required', {
          fields: { tenantId: !tenantId }
        });
      }

      const tenant = await prisma.organization.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      logger.info({
        message: 'Tenant switched',
        context: {
          userId: user.id,
          tenantId,
          tenantName: tenant.name
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Tenant switched successfully',
        tenant
      }));
    } catch (error: any) {
      logger.error({
        message: 'Tenant switch failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Tenant switch failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
