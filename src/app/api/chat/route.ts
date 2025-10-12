import { NextRequest, NextResponse } from 'next/server';
import {
  startChatSession,
  sendChatMessage,
  assignChatToAgent,
  resolveChat,
  closeChat,
  getActiveChats,
  getChatMessages,
  getChatSession,
  getChatStatistics,
} from '@/lib/chat/support';

export const dynamic = 'force-dynamic';

// Get chats, messages, or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const organizationId = searchParams.get('organizationId');
    const action = searchParams.get('action');

    if (action === 'stats' && organizationId) {
      const days = parseInt(searchParams.get('days') || '30');
      const end = new Date();
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      
      const stats = await getChatStatistics(organizationId, { start, end });
      return NextResponse.json({ success: true, data: stats });
    }

    if (chatId && action === 'messages') {
      const messages = await getChatMessages(chatId);
      return NextResponse.json({ success: true, data: messages });
    }

    if (chatId) {
      const chat = await getChatSession(chatId);
      return NextResponse.json({ success: true, data: chat });
    }

    if (organizationId) {
      const agentId = searchParams.get('agentId');
      const chats = await getActiveChats(organizationId, agentId || undefined);
      return NextResponse.json({ success: true, data: chats });
    }

    return NextResponse.json(
      { error: 'Chat ID or Organization ID is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat data' },
      { status: 500 }
    );
  }
}

// Start chat or send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'start') {
      const result = await startChatSession(data);
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.chat,
          message: 'Chat session started',
        });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }

    if (action === 'message') {
      const result = await sendChatMessage(data);
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.message,
          message: 'Message sent',
        });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat operation failed' },
      { status: 500 }
    );
  }
}

// Update chat (assign, resolve, close)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, action, ...data } = body;

    if (!chatId || !action) {
      return NextResponse.json(
        { error: 'Chat ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'assign':
        result = await assignChatToAgent(chatId, data.agentId);
        break;
      case 'resolve':
        result = await resolveChat(chatId, data.resolution);
        break;
      case 'close':
        result = await closeChat(chatId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Chat ${action} completed successfully`,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Update chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat update failed' },
      { status: 500 }
    );
  }
}

