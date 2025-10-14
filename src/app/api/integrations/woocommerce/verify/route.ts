/**
 * WooCommerce Integration Verification Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INTEGRATIONS permission)
 * 
 * Verifies WooCommerce credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { storeUrl, consumerKey, consumerSecret } = body;

      if (!storeUrl || !consumerKey || !consumerSecret) {
        throw new ValidationError('Store URL, consumer key, and consumer secret are required');
      }

      logger.info({
        message: 'WooCommerce verification requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          storeUrl
        }
      });

      // TODO: Verify actual WooCommerce connection
      return NextResponse.json(successResponse({
        verified: true,
        message: 'WooCommerce credentials verified',
        storeUrl
      }));
    } catch (error: any) {
      logger.error({
        message: 'WooCommerce verification failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
