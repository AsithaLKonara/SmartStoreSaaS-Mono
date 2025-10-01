export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsappService';

export async function GET(request: NextRequest) {
  try {
    // Get WhatsApp integration status
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        message: 'WhatsApp send endpoint is available'
      }
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, type = 'text' } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Get organization ID from authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const organizationId = decoded.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID not found in token' },
        { status: 401 }
      );
    }

    const result = await whatsappService.sendMessage(
      organizationId,
      to,
      message,
      type
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}