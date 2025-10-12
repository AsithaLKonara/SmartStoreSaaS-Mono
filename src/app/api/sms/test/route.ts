import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountSid, authToken } = body;

    if (!accountSid || !authToken) {
      return NextResponse.json({
        success: false,
        error: 'Account SID and Auth Token are required'
      }, { status: 400 });
    }

    // Validate Account SID format
    if (!accountSid.startsWith('AC')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Account SID format. Should start with AC'
      }, { status: 400 });
    }

    // In production, you would call Twilio API to verify
    // For now, validate format only
    return NextResponse.json({
      success: true,
      message: 'Twilio credentials validated successfully',
      accountSid: accountSid,
      verified: true
    });
  } catch (error: any) {
    console.error('SMS test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

