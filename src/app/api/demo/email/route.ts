import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const to: string | undefined = body.to || process.env.SMTP_USER;

    if (!to) {
      return NextResponse.json({ error: 'Recipient not provided and SMTP_USER not set' }, { status: 400 });
    }

    const result = await emailService.sendEmail({
      to,
      content: {
        subject: 'SmartStore Demo Email',
        text: 'This is a demo email from SmartStore SaaS.',
        html: '<p>This is a <strong>demo email</strong> from SmartStore SaaS.</p>',
      },
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}


