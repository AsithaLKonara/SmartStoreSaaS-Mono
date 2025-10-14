/**
 * SMS OTP API Route
 * 
 * Authorization:
 * - POST: Public (OTP verification for login/signup)
 * 
 * Sends OTP via SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { phone, action = 'login' } = body;

      if (!phone) {
        throw new ValidationError('Phone number is required');
      }

      logger.info({
        message: 'OTP requested',
        context: { phone, action }
      });

      // TODO: Generate and send actual OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      return NextResponse.json(successResponse({
        sent: true,
        expiresIn: 300, // 5 minutes
        message: 'OTP sent successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'OTP send failed',
        error: error
      });
      throw error;
    }
  }
);
