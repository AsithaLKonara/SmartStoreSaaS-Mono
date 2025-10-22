/**
 * Return Rejection API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (APPROVE_RETURNS permission)
 * 
 * Organization Scoping: Validated through return
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const returnId = params.id;
      const body = await request.json();
      const { reason } = body;

      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId }
      });

      if (!returnRequest) {
        throw new ValidationError('Return not found');
      }

      if (returnRequest.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot reject returns from other organizations');
      }

      await prisma.return.update({
        where: { id: returnId },
        data: {
          status: 'REJECTED',
          rejectedBy: user.id,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      logger.info({
        message: 'Return rejected',
        context: { userId: user.id, returnId, reason }
      });

      return NextResponse.json(successResponse({
        message: 'Return rejected',
        returnId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Return rejection failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

