/**
 * GDPR Data Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, CUSTOMER
 *   - CUSTOMER can export own data
 *   - Admins can export for any user in their org
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/compliance/gdpr/export
 * Export GDPR data (authenticated users, customers can only export own data)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { userId } = body;

      // Customers can only export their own data
      if (user.role === 'CUSTOMER' && userId && userId !== user.id) {
        throw new AuthorizationError('Can only export your own data');
      }

      const targetUserId = userId || user.id;

      // Verify user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { organizationId: true }
      });

      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      // Non-SUPER_ADMIN can only export data from their own organization
      if (user.role !== 'SUPER_ADMIN') {
        await validateOrganizationAccess(user, targetUser.organizationId);
      }

      logger.info({
        message: 'GDPR data export requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          targetUserId,
          role: user.role
        },
        correlation: req.correlationId
      });

      // TODO: Generate actual data export
      const exportData = {
        user: { id: targetUserId },
        orders: [],
        message: 'Data export - full implementation pending'
      };

      return NextResponse.json(successResponse(exportData));
    } catch (error: any) {
      logger.error({
        message: 'GDPR export failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'GDPR export failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
