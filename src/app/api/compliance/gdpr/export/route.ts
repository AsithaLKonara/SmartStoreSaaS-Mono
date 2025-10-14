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
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { userId } = body;

      // Customers can only export their own data
      if (user.role === 'CUSTOMER' && userId && userId !== user.id) {
        throw new ValidationError('Can only export your own data');
      }

      const targetUserId = userId || user.id;

      // Verify user belongs to same organization
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        throw new ValidationError('User not found');
      }

      if (targetUser.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot export data for users in other organizations');
      }

      logger.info({
        message: 'GDPR data export requested',
        context: {
          requestedBy: user.id,
          targetUserId,
          organizationId: user.organizationId
        }
      });

      // TODO: Generate actual data export
      const exportData = {
        user: targetUser,
        orders: [],
        message: 'Data export - full implementation pending'
      };

      return NextResponse.json(successResponse(exportData));
    } catch (error: any) {
      logger.error({
        message: 'GDPR export failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
