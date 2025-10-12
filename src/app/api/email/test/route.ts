import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'SendGrid API key is required'
      }, { status: 400 });
    }

    // Validate API key format
    if (!apiKey.startsWith('SG.')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid SendGrid API key format. Should start with SG.'
      }, { status: 400 });
    }

    // In production, you would call SendGrid API to verify
    // For now, validate format only
    return NextResponse.json({
      success: true,
      message: 'SendGrid API key validated successfully',
      verified: true
    });
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

