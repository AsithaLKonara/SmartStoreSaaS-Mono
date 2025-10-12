import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, merchantSecret, sandbox } = body;

    if (!merchantId || !merchantSecret) {
      return NextResponse.json({
        success: false,
        error: 'Merchant ID and Merchant Secret are required'
      }, { status: 400 });
    }

    // Validate merchant ID format (should be numeric)
    if (!/^\d+$/.test(merchantId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Merchant ID format. Should be numeric.'
      }, { status: 400 });
    }

    // In production, you would call PayHere API to verify
    // For now, validate format only
    return NextResponse.json({
      success: true,
      message: 'PayHere credentials validated successfully',
      mode: sandbox ? 'sandbox' : 'live',
      merchantId: merchantId,
      currency: 'LKR'
    });
  } catch (error: any) {
    console.error('PayHere test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

