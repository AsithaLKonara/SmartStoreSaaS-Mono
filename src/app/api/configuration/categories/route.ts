/**
 * Configuration Categories API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SETTINGS permission)
 * 
 * Returns available configuration categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      logger.info({
        message: 'Configuration categories fetched',
        context: { userId: user.id }
      });

      const categories = [
        { id: 'general', name: 'General Settings' },
        { id: 'payment', name: 'Payment Settings' },
        { id: 'shipping', name: 'Shipping Settings' },
        { id: 'tax', name: 'Tax Settings' },
        { id: 'email', name: 'Email Settings' },
        { id: 'integrations', name: 'Integrations' }
      ];

      return NextResponse.json(successResponse(categories));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch configuration categories',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
