import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/whatsapp/verify
 * Verify WhatsApp integration (MANAGE_INTEGRATIONS permission)
 */
export const POST = requirePermission('MANAGE_INTEGRATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();

      logger.info({
        message: 'WhatsApp integration verification initiated',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement WhatsApp verification
      // This would typically involve verifying WhatsApp credentials
      const verification = {
        status: 'pending',
        message: 'Verification initiated',
        verificationId: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      return NextResponse.json(successResponse(verification));
    } catch (error: any) {
      logger.error({
        message: 'Failed to verify WhatsApp integration',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to verify WhatsApp integration',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);