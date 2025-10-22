/**
 * Payment Refund API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PAYMENTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    logger.info({
      message: 'Refund requested',
      context: { userId: user.id, role: user.role }
    });
    
    return NextResponse.json(successResponse({ 
      message: 'Payment refund endpoint',
      status: 'coming_soon'
    }));
  }
);

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    return NextResponse.json(successResponse({ 
      message: 'Use POST for refund requests',
      status: 'method_not_allowed'
    }));
  }
);
