import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// WhatsApp webhook for receiving messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (implement based on WhatsApp Business API)
    const signature = request.headers.get('x-hub-signature-256');
    // TODO: Add signature verification here
    
    console.log('WhatsApp webhook received:', body);

    // Handle different webhook events
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            for (const message of change.value.messages || []) {
              await handleIncomingMessage(message, change.value.metadata);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook verification for WhatsApp
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    // Extract message data
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageType = message.type;
    const messageId = message.id;
    const timestamp = message.timestamp;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        phone: phoneNumber,
      },
    });

    if (!customer) {
      // Create new customer from WhatsApp message
      customer = await prisma.customer.create({
        data: {
          name: `WhatsApp User ${phoneNumber}`,
          phone: phoneNumber,
          source: 'WHATSAPP',
          organizationId: metadata.phone_number_id, // This should be mapped to organization
        },
      });
    }

    // Create WhatsApp message record
    await prisma.whatsAppMessage.create({
      data: {
        organizationId: customer.organizationId,
        customerId: customer.id,
        phoneNumber,
        message: messageText,
        type: messageType,
        status: 'RECEIVED',
        direction: 'INBOUND',
        externalId: messageId,
        receivedAt: new Date(parseInt(timestamp) * 1000),
      },
    });

    // Process auto-reply if enabled
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: {
        phoneNumber: metadata.phone_number_id,
        isActive: true,
      },
    });

    if (integration && integration.syncSettings) {
      const settings = JSON.parse(integration.syncSettings);
      
      if (settings.autoReply) {
        // Send auto-reply
        await sendAutoReply(customer, settings, messageText);
      }
    }

    console.log(`Processed WhatsApp message from ${phoneNumber}: ${messageText}`);
  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error);
  }
}

async function sendAutoReply(customer: any, settings: any, incomingMessage: string) {
  try {
    let replyMessage = '';

    // Check if it's business hours
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: settings.timezone || 'Asia/Colombo' 
    });
    const [startTime, endTime] = settings.businessHours.split('-');
    
    const isBusinessHours = currentTime >= startTime && currentTime <= endTime;
    
    if (isBusinessHours) {
      // Use welcome message or process quick replies
      if (settings.quickReplies.includes(incomingMessage)) {
        switch (incomingMessage) {
          case 'Order Status':
            replyMessage = 'Please provide your order number to check the status.';
            break;
          case 'Product Information':
            replyMessage = 'What product would you like to know about?';
            break;
          case 'Support':
            replyMessage = 'How can we help you today?';
            break;
          case 'Speak to Agent':
            replyMessage = 'An agent will be with you shortly.';
            break;
          default:
            replyMessage = settings.welcomeMessage || 'Hello! How can we help you today?';
        }
      } else {
        replyMessage = settings.welcomeMessage || 'Hello! How can we help you today?';
      }
    } else {
      replyMessage = settings.awayMessage || 'We are currently away. We will get back to you soon!';
    }

    // Create auto-reply message
    await prisma.whatsAppMessage.create({
      data: {
        organizationId: customer.organizationId,
        customerId: customer.id,
        phoneNumber: customer.phone,
        message: replyMessage,
        type: 'text',
        status: 'SENT',
        direction: 'OUTBOUND',
        isAutoReply: true,
      },
    });

    // TODO: Send actual WhatsApp message via API
    console.log(`Auto-reply sent to ${customer.phone}: ${replyMessage}`);
  } catch (error) {
    console.error('Error sending auto-reply:', error);
  }
}
