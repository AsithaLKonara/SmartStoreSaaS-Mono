import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendBulkSMS } from '@/lib/integrations/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, bulk, messages } = body;

    // Bulk SMS sending
    if (bulk && messages && Array.isArray(messages)) {
      const result = await sendBulkSMS(messages);
      return NextResponse.json({
        success: result.success,
        sent: result.sent,
        failed: result.failed,
        message: `Sent ${result.sent} messages, ${result.failed} failed`,
      });
    }

    // Single SMS sending
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await sendSMS({ to, message });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send SMS',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

