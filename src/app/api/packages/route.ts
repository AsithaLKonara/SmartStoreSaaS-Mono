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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      // TODO: Implement package/subscription plan management
      // For now, return empty array as Package model doesn't exist
      const packages: any[] = [];

      logger.info({
        message: 'Packages fetched',
        context: { userId: user.id, count: packages.length }
      });

      return NextResponse.json(successResponse(packages));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch packages',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, description, price, features } = body;

      if (!name || price === undefined) {
        throw new ValidationError('Name and price are required');
      }

      // TODO: Implement package creation when Package model is added
      throw new ValidationError('Package creation not yet implemented');
    } catch (error: any) {
      logger.error({
        message: 'Failed to create package',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

