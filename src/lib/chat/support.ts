/**
 * Real-time Chat Support System
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface ChatMessage {
  senderId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  message: string;
  attachments?: string[];
}

/**
 * Start chat session
 */
export async function startChatSession(data: {
  customerId: string;
  organizationId: string;
  subject?: string;
  initialMessage?: string;
}): Promise<{ success: boolean; chat?: any; error?: string }> {
  try {
    const chat = await prisma.chatSession.create({
      data: {
        customerId: data.customerId,
        organizationId: data.organizationId,
        subject: data.subject || 'Support Request',
        status: ChatStatus.ACTIVE,
        messages: data.initialMessage ? {
          create: {
            senderId: data.customerId,
            senderType: 'CUSTOMER',
            message: data.initialMessage,
          },
        } : undefined,
      },
      include: {
        messages: true,
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, chat };
  } catch (error: any) {
    logger.error({
      message: 'Start chat error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ChatSupport', operation: 'startChat', customerId: data.customerId, organizationId: data.organizationId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(data: {
  chatId: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  message: string;
  attachments?: string[];
}): Promise<{ success: boolean; message?: any; error?: string }> {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        attachments: data.attachments || [],
      },
    });

    // Update last activity
    await prisma.chatSession.update({
      where: { id: data.chatId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return { success: true, message };
  } catch (error: any) {
    logger.error({
      message: 'Send message error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ChatSupport', operation: 'sendMessage', chatId: data.chatId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Assign chat to agent
 */
export async function assignChatToAgent(
  chatId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        agentId,
        assignedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Assign chat error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ChatSupport', operation: 'assignChat', chatId, agentId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Resolve chat
 */
export async function resolveChat(
  chatId: string,
  resolution?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        status: ChatStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Resolve chat error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ChatSupport', operation: 'resolveChat', chatId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Close chat
 */
export async function closeChat(chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        status: ChatStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Close chat error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ChatSupport', operation: 'closeChat', chatId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get active chats for agent
 */
export async function getActiveChats(organizationId: string, agentId?: string) {
  const where: any = {
    organizationId,
    status: ChatStatus.ACTIVE,
  };

  if (agentId) {
    where.agentId = agentId;
  }

  return await prisma.chatSession.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
}

/**
 * Get chat messages
 */
export async function getChatMessages(chatId: string, limit: number = 100) {
  return await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Get chat session
 */
export async function getChatSession(chatId: string) {
  return await prisma.chatSession.findUnique({
    where: { id: chatId },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      agent: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Get chat statistics
 */
export async function getChatStatistics(organizationId: string, period: { start: Date; end: Date }) {
  const { start, end } = period;

  const [
    totalChats,
    activeChats,
    resolvedChats,
    averageResolutionTime,
  ] = await Promise.all([
    prisma.chatSession.count({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.chatSession.count({
      where: {
        organizationId,
        status: ChatStatus.ACTIVE,
      },
    }),
    prisma.chatSession.count({
      where: {
        organizationId,
        status: ChatStatus.RESOLVED,
        createdAt: { gte: start, lte: end },
      },
    }),
    calculateAverageResolutionTime(organizationId, start, end),
  ]);

  return {
    totalChats,
    activeChats,
    resolvedChats,
    averageResolutionTimeMinutes: averageResolutionTime,
    resolutionRate: totalChats > 0 ? (resolvedChats / totalChats) * 100 : 0,
  };
}

async function calculateAverageResolutionTime(
  organizationId: string,
  start: Date,
  end: Date
): Promise<number> {
  const resolvedChats = await prisma.chatSession.findMany({
    where: {
      organizationId,
      status: ChatStatus.RESOLVED,
      createdAt: { gte: start, lte: end },
      resolvedAt: { not: null },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
    },
  });

  if (resolvedChats.length === 0) return 0;

  const totalMinutes = resolvedChats.reduce((sum, chat) => {
    const minutes = (chat.resolvedAt!.getTime() - chat.createdAt.getTime()) / 1000 / 60;
    return sum + minutes;
  }, 0);

  return Math.round(totalMinutes / resolvedChats.length);
}

