import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppConnection } from '@/lib/integrations/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const isConnected = await verifyWhatsAppConnection();

    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected 
        ? 'WhatsApp connection verified' 
        : 'WhatsApp not connected. Check credentials.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message || 'Failed to verify connection',
      },
      { status: 500 }
    );
  }
}

