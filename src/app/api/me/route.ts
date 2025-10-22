/**
 * Current User Profile API Route
 * 
 * Authorization:
 * - GET: Requires authentication
 * - PUT: Requires authentication (can update own profile)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleTag: true,
          organizationId: true,
          isActive: true,
          emailVerified: true,
          phone: true,
          mfaEnabled: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info({
        message: 'User profile fetched',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse(userData));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch user profile',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, phone } = body;

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          updatedAt: true
        }
      });

      logger.info({
        message: 'User profile updated',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update user profile',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
