/**
 * Return Approval API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (APPROVE_RETURNS permission)
 * 
 * Organization Scoping: Validated through return
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const returnId = params.id;

      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId }
      });

      if (!returnRequest) {
        throw new ValidationError('Return not found');
      }

      if (returnRequest.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot approve returns from other organizations');
      }

      await prisma.return.update({
        where: { id: returnId },
        data: {
          status: 'APPROVED',
          approvedById: user.id,
          approvedAt: new Date()
        }
      });

      logger.info({
        message: 'Return approved',
        context: { userId: user.id, returnId }
      });

      return NextResponse.json(successResponse({
        message: 'Return approved',
        returnId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Return approval failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

