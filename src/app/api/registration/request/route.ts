/**
 * Registration Request API Route
 * 
 * Authorization:
 * - POST: Public (new organization signup request)
 * 
 * Creates new tenant registration request
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { organizationName, adminEmail, adminName, plan } = body;

      if (!organizationName || !adminEmail || !adminName) {
        throw new ValidationError('Organization name, admin email, and name are required');
      }

      logger.info({
        message: 'Organization registration requested',
        context: {
          organizationName,
          adminEmail,
          plan
        }
      });

      // TODO: Create actual registration request
      return NextResponse.json(successResponse({
        requestId: `req_${Date.now()}`,
        status: 'pending_approval',
        message: 'Registration request submitted'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Registration request failed',
        error: error
      });
      throw error;
    }
  }
);
