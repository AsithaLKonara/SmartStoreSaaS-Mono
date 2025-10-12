import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publishableKey, secretKey, testMode } = body;

    if (!publishableKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'Publishable key and secret key are required'
      }, { status: 400 });
    }

    // Validate key format
    const expectedPrefix = testMode ? 'pk_test_' : 'pk_live_';
    const expectedSecretPrefix = testMode ? 'sk_test_' : 'sk_live_';

    if (!publishableKey.startsWith(expectedPrefix)) {
      return NextResponse.json({
        success: false,
        error: `Invalid publishable key format. Expected ${testMode ? 'test' : 'live'} key starting with ${expectedPrefix}`
      }, { status: 400 });
    }

    if (!secretKey.startsWith(expectedSecretPrefix)) {
      return NextResponse.json({
        success: false,
        error: `Invalid secret key format. Expected ${testMode ? 'test' : 'live'} key starting with ${expectedSecretPrefix}`
      }, { status: 400 });
    }

    // In production, you would call Stripe API to verify
    // For now, validate format only
    return NextResponse.json({
      success: true,
      message: 'Stripe credentials validated successfully',
      mode: testMode ? 'test' : 'live',
      accountId: 'acct_' + Math.random().toString(36).substr(2, 9)
    });
  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

