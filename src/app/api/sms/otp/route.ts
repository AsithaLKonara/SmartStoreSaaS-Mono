import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/integrations/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP
    const result = await sendOTP(phoneNumber, otp);

    if (result.success) {
      // In production, store OTP in database/cache with expiry
      // For now, return it (DON'T do this in production!)
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        otp, // Remove this in production
        message: 'OTP sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send OTP',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('OTP API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

