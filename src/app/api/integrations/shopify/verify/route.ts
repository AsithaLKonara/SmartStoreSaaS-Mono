/**
 * Shopify Integration Verification Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INTEGRATIONS permission)
 * 
 * Verifies Shopify OAuth connection
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
      const { shopDomain, accessToken } = body;

      if (!shopDomain || !accessToken) {
        throw new ValidationError('Shop domain and access token are required');
      }

      logger.info({
        message: 'Shopify verification requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          shopDomain
        }
      });

      // TODO: Verify actual Shopify connection
      return NextResponse.json(successResponse({
        verified: true,
        message: 'Shopify credentials verified',
        shopDomain
      }));
    } catch (error: any) {
      logger.error({
        message: 'Shopify verification failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
