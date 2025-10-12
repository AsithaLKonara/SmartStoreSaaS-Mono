import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlContent, textContent, replyTo } = body;

    // Validate input
    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient and subject are required' },
        { status: 400 }
      );
    }

    if (!htmlContent && !textContent) {
      return NextResponse.json(
        { error: 'Either HTML or text content is required' },
        { status: 400 }
      );
    }

    // Send email
    const result = await emailService.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: textContent || htmlContent?.replace(/<[^>]*>/g, ''),
      replyTo,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

