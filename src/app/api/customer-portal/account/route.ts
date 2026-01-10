import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, NotFoundError, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/account
 * Get customer account (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: user.id },
        include: {
          loyalty: true
        }
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      logger.info({
        message: 'Customer account fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(customer));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer account',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch customer account',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * PUT /api/customer-portal/account
 * Update customer account (authenticated customer)
 */
export const PUT = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const updated = await prisma.customer.update({
        where: { id: user.id },
        data: body
      });

      logger.info({
        message: 'Customer account updated',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update customer account',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to update customer account',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customer-portal/account
 * Redirect to PUT method
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'POST to account endpoint - redirecting to PUT',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Use PUT to update account',
        status: 'use_put_method'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to process POST request',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to process POST request',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);