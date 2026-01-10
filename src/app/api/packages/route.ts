/**
 * Packages API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_PACKAGES permission)
 * - POST: SUPER_ADMIN only (MANAGE_PACKAGES permission)
 * 
 * System-wide: Subscription packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/packages
 * Get subscription packages (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // TODO: Implement package/subscription plan management
      // For now, return empty array as Package model doesn't exist
      const packages: any[] = [];

      logger.info({
        message: 'Packages fetched',
        context: {
          userId: user.id,
          count: packages.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(packages));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch packages',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch packages',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/packages
 * Create subscription package (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, description, price, features } = body;

      if (!name || price === undefined) {
        throw new ValidationError('Name and price are required', {
          fields: { name: !name, price: price === undefined }
        });
      }

      // TODO: Implement package creation when Package model is added
      throw new ValidationError('Package creation not yet implemented');
    } catch (error: any) {
      logger.error({
        message: 'Failed to create package',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create package',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

