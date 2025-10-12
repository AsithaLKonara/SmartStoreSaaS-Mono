import { NextRequest, NextResponse } from 'next/server';
import { initiatePayHerePayment } from '@/lib/integrations/payhere';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      currency = 'LKR',
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country = 'Sri Lanka',
      items,
    } = body;

    // Validate required fields
    if (!orderId || !amount || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get base URL from request
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Initiate PayHere payment
    const result = await initiatePayHerePayment({
      orderId,
      amount,
      currency,
      firstName,
      lastName,
      email,
      phone,
      address: address || '',
      city: city || 'Colombo',
      country,
      returnUrl: `${baseUrl}/payments/payhere/return`,
      cancelUrl: `${baseUrl}/payments/payhere/cancel`,
      notifyUrl: `${baseUrl}/api/payments/payhere/notify`,
      items: items || `Order ${orderId}`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        hash: result.hash,
        merchantId: process.env.PAYHERE_MERCHANT_ID,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to initiate payment',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('PayHere initiate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

