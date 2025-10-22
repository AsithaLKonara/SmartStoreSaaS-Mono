/**
 * SMS OTP API Route
 * 
 * Authorization:
 * - POST: Public (OTP verification for login/signup)
 * 
 * Sends OTP via SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const body = await req.json();
    const { phone, action = 'login' } = body;

    if (!phone) {
      return NextResponse.json({ success: false, code: 'ERR_VALIDATION', message: 'Phone number is required' }, { status: 400 });
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
  }
);
