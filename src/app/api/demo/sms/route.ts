import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms/smsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const to: string | undefined = body.to || process.env.TWILIO_DEMO_TO;
    const bodyText: string = body.body || 'This is a demo SMS from SmartStore SaaS.';

    if (!to) {
      return NextResponse.json({ error: 'Recipient not provided and TWILIO_DEMO_TO not set' }, { status: 400 });
    }

    const result = await smsService.sendSMS({ to, body: bodyText });
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}


