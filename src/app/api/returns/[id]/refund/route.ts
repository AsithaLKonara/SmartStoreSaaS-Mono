/**
 * Return Refund Processing API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (PROCESS_REFUNDS permission)
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
      const { refundAmount, refundMethod } = body;

      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId }
      });

      if (!returnRequest) {
        throw new ValidationError('Return not found');
      }

      if (returnRequest.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot process refunds for other organizations');
      }

      if (returnRequest.status !== 'APPROVED') {
        throw new ValidationError('Return must be approved before refund');
      }

      await prisma.return.update({
        where: { id: returnId },
        data: {
          status: 'REFUNDED',
          refundAmount,
          refundMethod,
          refundedBy: user.id,
          refundedAt: new Date()
        }
      });

      logger.info({
        message: 'Return refund processed',
        context: { userId: user.id, returnId, refundAmount }
      });

      return NextResponse.json(successResponse({
        message: 'Refund processed successfully',
        returnId,
        refundAmount
      }));
    } catch (error: any) {
      logger.error({
        message: 'Return refund processing failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

