import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/integrations/shopify';

export async function GET(request: NextRequest) {
  try {
    const result = await shopifyService.verifyConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        connected: true,
        shop: result.shop,
        message: 'Shopify connection verified',
      });
    } else {
      return NextResponse.json({
        success: false,
        connected: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message || 'Connection verification failed',
      },
      { status: 500 }
    );
  }
}

