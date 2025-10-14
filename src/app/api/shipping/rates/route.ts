/**
 * Shipping Rates API Route
 * 
 * Authorization:
 * - GET/POST: Requires authentication
 * - Used during checkout to calculate shipping
 * 
 * Organization Scoping: N/A (shipping rates)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    logger.info({
      message: 'Shipping rates requested',
      context: { userId: user.id }
    });
    
    return NextResponse.json(successResponse({ 
      message: 'Shipping rates calculation',
      status: 'coming_soon'
    }));
  }
);

export const GET = requireAuth(
  async (request, user) => {
    return NextResponse.json(successResponse({ 
      message: 'Use POST for shipping rate calculation',
      status: 'method_not_allowed'
    }));
  }
);
