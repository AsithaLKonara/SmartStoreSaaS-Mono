/**
 * Integrations List API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_INTEGRATIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Integrations list fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch actual integrations
      const integrations = [
        { id: 'shopify', name: 'Shopify', status: 'available' },
        { id: 'woocommerce', name: 'WooCommerce', status: 'available' },
        { id: 'stripe', name: 'Stripe', status: 'available' },
        { id: 'payhere', name: 'PayHere', status: 'available' },
        { id: 'whatsapp', name: 'WhatsApp Business', status: 'available' }
      ];

      return NextResponse.json(successResponse(integrations));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch integrations',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
