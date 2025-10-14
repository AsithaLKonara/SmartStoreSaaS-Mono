/**
 * Admin Packages API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (MANAGE_PACKAGES permission)
 * - POST: SUPER_ADMIN only
 * 
 * System-wide: Not organization-scoped
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      logger.info({
        message: 'Packages fetched by SUPER_ADMIN',
        context: { userId: user.id }
      });

      // TODO: Fetch from packages table
      return NextResponse.json(successResponse({
        packages: [],
        message: 'Package management - implementation pending'
      }));
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
      const { name, features, price } = body;

      if (!name) {
        throw new ValidationError('Package name is required');
      }

      logger.info({
        message: 'Package created',
        context: { userId: user.id, packageName: name }
      });

      return NextResponse.json(successResponse({
        name,
        features,
        price,
        message: 'Package created'
      }), { status: 201 });
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
