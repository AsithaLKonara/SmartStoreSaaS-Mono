/**
 * Registration Request API Route
 * 
 * Authorization:
 * - POST: Public (new organization signup request)
 * 
 * Creates new tenant registration request
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { organizationName, adminEmail, adminName, plan } = body;

      if (!organizationName || !adminEmail || !adminName) {
        return NextResponse.json({
          success: false,
          code: 'ERR_VALIDATION',
          message: 'Organization name, admin email, and name are required'
        }, { status: 400 });
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
