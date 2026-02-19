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

import { SmsService } from '@/lib/services/sms.service';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ success: false, code: 'ERR_VALIDATION', message: 'Phone number is required' }, { status: 400 });
    }

    // 1. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Send SMS
    const result = await SmsService.sendOTP(phone, otp);

    logger.info({
      message: 'OTP sent successfully',
      context: { phone, provider: result.provider }
    });

    return NextResponse.json(successResponse({
      sent: true,
      expiresIn: 300, // 5 minutes
      provider: result.provider
    }));
  }
);
