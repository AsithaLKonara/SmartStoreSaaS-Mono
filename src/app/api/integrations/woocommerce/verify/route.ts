import { NextRequest, NextResponse } from 'next/server';
import { wooCommerceService } from '@/lib/integrations/woocommerce';

export async function GET(request: NextRequest) {
  try {
    const result = await wooCommerceService.verifyConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        connected: true,
        version: result.version,
        wcVersion: result.wcVersion,
        message: 'WooCommerce connection verified',
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

