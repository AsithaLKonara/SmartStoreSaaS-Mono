import { prisma } from '@/lib/prisma';

export interface ChannelMessage {
  id: string;
  senderId?: string | null;
  senderRole: string; // SYSTEM, AI, ADMIN, CUSTOMER
  content: string;
  createdAt: Date;
  status?: string;
  metadata?: any;
}

export interface CustomerConversation {
  id: string;
  customerId?: string | null;
  type: string;
  messages: ChannelMessage[];
  status: string;
  assignedAgentId?: string | null;
  priority?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface UnifiedInbox {
  conversations: CustomerConversation[];
  unreadCount: number;
  pendingCount: number;
  urgentCount: number;
}

export interface ChannelIntegration {
  channel: string;
  isActive: boolean;
  config: unknown;
  lastSync: Date;
}

export class OmnichannelService {
  async getUnifiedInbox(organizationId: string): Promise<UnifiedInbox> {
    const conversations = await prisma.conversation.findMany({
      where: { organizationId },
      include: {
        customer: true,
        assignedAgent: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const transformedConversations: CustomerConversation[] = conversations.map((c: any) => ({
      id: c.id,
      customerId: c.customerId,
      type: c.type,
      messages: (c.messages || []).map((m: any) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt,
        status: (m.metadata as any)?.status
      })),
      status: c.status,
      priority: (c.metadata as any)?.priority,
      tags: (c.metadata as any)?.tags || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      organizationId: c.organizationId,
      assignedAgentId: c.userId
    }));

    const unreadCount = transformedConversations.filter((c: any) =>
      c.messages.some((m: any) => m.senderRole === 'CUSTOMER' && m.status === 'sent')
    ).length;

    const pendingCount = transformedConversations.filter((c: any) => c.status === 'PENDING').length;
    const urgentCount = transformedConversations.filter((c: any) => c.priority === 'URGENT').length;

    return {
      conversations: transformedConversations,
      unreadCount,
      pendingCount,
      urgentCount
    };
  }

  async getConversation(conversationId: string): Promise<CustomerConversation | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        customer: true,
        assignedAgent: true
      }
    });

    if (!conversation) return null;

    return {
      id: conversation.id,
      customerId: conversation.customerId,
      type: conversation.type,
      messages: (conversation.messages || []).map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt,
        status: (m.metadata as any)?.status,
        metadata: m.metadata
      })),
      status: conversation.status,
      priority: (conversation.metadata as any)?.priority,
      tags: (conversation.metadata as any)?.tags || [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      organizationId: conversation.organizationId,
      assignedAgentId: conversation.userId
    };
  }

  async sendMessage(conversationId: string, message: string, _channel: string): Promise<ChannelMessage> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Send message through appropriate channel (actual implementation depends on type)
    const sentMessage = await this.sendToChannel(conversation.type.toLowerCase(), conversation.customerId!, message);

    // Save message to database
    const savedMessage = await prisma.conversationMessage.create({
      data: {
        conversationId,
        senderRole: 'ADMIN', // Or appropriate role
        content: message,
        createdAt: new Date(),
        metadata: {
          status: 'sent',
          channelResponse: sentMessage
        }
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    return {
      id: savedMessage.id,
      senderRole: savedMessage.senderRole,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      status: 'sent',
      metadata: savedMessage.metadata
    };
  }

  async assignAgent(conversationId: string, agentId: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { userId: agentId }
    });
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status }
    });
  }

  async addConversationTags(conversationId: string, tags: string[]): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) return;

    const currentMetadata = (conversation.metadata as any) || {};
    const currentTags = currentMetadata.tags || [];
    const updatedTags = Array.from(new Set([...currentTags, ...tags]));

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: {
          ...currentMetadata,
          tags: updatedTags
        }
      }
    });
  }

  async getChannelIntegrations(organizationId: string): Promise<ChannelIntegration[]> {
    const integrations = await prisma.channelIntegration.findMany({
      where: { organizationId }
    });

    return integrations.map((integration: any) => ({
      channel: integration.channel,
      isActive: integration.isActive,
      config: integration.config,
      lastSync: integration.lastSync
    }));
  }

  async updateChannelIntegration(organizationId: string, channel: string, config: any): Promise<void> {
    // Find existing integration by organizationId and channel
    const existing = await prisma.channelIntegration.findFirst({
      where: { organizationId, channel }
    });

    if (existing) {
      // Update existing
      await prisma.channelIntegration.update({
        where: { id: existing.id },
        data: {
          config,
          lastSync: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      await prisma.channelIntegration.create({
        data: {
          id: `ch_int_${Date.now()}`,
          organizationId,
          name: `${channel} Integration`,
          channel,
          provider: 'CUSTOM',
          type: 'CUSTOM',
          config,
          isActive: true,
          lastSync: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }

  async syncChannelMessages(organizationId: string, channel: string): Promise<void> {
    // Sync messages from external channel
    const integration = await prisma.channelIntegration.findFirst({ // Fix: Use findFirst instead of findUnique
      where: { organizationId, channel }
    });

    if (!integration || !integration.isActive) {
      throw new Error(`Channel ${channel} not configured or inactive`);
    }

    // Fetch new messages from channel
    const newMessages = await this.fetchChannelMessages(channel, integration.config);

    // Process and save messages
    for (const message of newMessages) {
      await this.processIncomingMessage(organizationId, channel, message);
    }

    // Update last sync time
    await prisma.channelIntegration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() }
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerConversation[]> {
    const conversations = await prisma.conversation.findMany({
      where: { customerId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return conversations.map((c: any) => ({
      id: c.id,
      customerId: c.customerId,
      type: c.type,
      messages: (c.messages || []).map((m: any) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt,
        status: (m.metadata as any)?.status
      })),
      status: c.status,
      priority: (c.metadata as any)?.priority,
      tags: (c.metadata as any)?.tags || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      organizationId: c.organizationId,
      assignedAgentId: c.userId
    }));
  }

  async createConversation(customerId: string, channel: string, _initialMessage: string, organizationId?: string): Promise<CustomerConversation> {
    // Resolve organizationId from customer if not provided
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { organizationId: true }
      }).catch(() => null);
      resolvedOrgId = customer?.organizationId ?? 'unknown';
    }

    const conversation = await prisma.conversation.create({
      data: {
        customerId,
        type: channel.toUpperCase() as any,
        status: 'ACTIVE',
        metadata: {
          priority: 'MEDIUM',
          tags: []
        },
        organizationId: resolvedOrgId
      },
      include: {
        messages: true,
        customer: true
      }
    });

    return {
      id: conversation.id,
      customerId: conversation.customerId,
      type: conversation.type,
      messages: [],
      status: conversation.status,
      priority: 'MEDIUM',
      tags: [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      organizationId: conversation.organizationId,
      assignedAgentId: conversation.userId
    };
  }

  private async sendToChannel(channel: string, customerId: string, message: string): Promise<any> {
    // Implementation for sending messages to different channels
    switch (channel) {
      case 'whatsapp':
        return await this.sendWhatsAppMessage(customerId, message);
      case 'facebook':
        return await this.sendFacebookMessage(customerId, message);
      case 'instagram':
        return await this.sendInstagramMessage(customerId, message);
      case 'email':
        return await this.sendEmailMessage(customerId, message);
      case 'sms':
        return await this.sendSMSMessage(customerId, message);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async fetchChannelMessages(channel: string, config: any): Promise<unknown[]> {
    // Implementation for fetching messages from different channels
    switch (channel) {
      case 'whatsapp':
        return await this.fetchWhatsAppMessages(config);
      case 'facebook':
        return await this.fetchFacebookMessages(config);
      case 'instagram':
        return await this.fetchInstagramMessages(config);
      default:
        return [];
    }
  }

  private async processIncomingMessage(organizationId: string, channel: string, message: any): Promise<void> {
    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId: message.customerId || undefined,
        type: channel.toUpperCase() as any,
        status: { in: ['ACTIVE', 'PENDING'] }
      },
      include: {
        messages: true,
        customer: true
      }
    });

    if (!conversation) {
      const newConv = await this.createConversation(message.customerId, channel, message.text);
      conversation = await prisma.conversation.findUnique({
        where: { id: newConv.id },
        include: { messages: true, customer: true }
      }) as any;
    }

    if (!conversation) {
      throw new Error('Failed to create or find conversation');
    }

    // Save incoming message
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderRole: 'CUSTOMER',
        content: message.text,
        createdAt: new Date(),
        metadata: {
          status: 'delivered'
        }
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
  }

  // Channel-specific implementations
  private async sendWhatsAppMessage(customerId: string, message: string): Promise<any> {
    // WhatsApp Business API implementation
    return { status: 'sent', messageId: `wa_${Date.now()}` };
  }

  private async sendFacebookMessage(customerId: string, message: string): Promise<any> {
    // Facebook Messenger API implementation
    return { status: 'sent', messageId: `fb_${Date.now()}` };
  }

  private async sendInstagramMessage(customerId: string, message: string): Promise<any> {
    // Instagram DM API implementation
    return { status: 'sent', messageId: `ig_${Date.now()}` };
  }

  private async sendEmailMessage(customerId: string, message: string): Promise<any> {
    // Email service implementation
    return { status: 'sent', messageId: `email_${Date.now()}` };
  }

  private async sendSMSMessage(customerId: string, message: string): Promise<any> {
    // SMS service implementation
    return { status: 'sent', messageId: `sms_${Date.now()}` };
  }

  private async fetchWhatsAppMessages(config: any): Promise<unknown[]> {
    // WhatsApp Business API message fetching
    return [];
  }

  private async fetchFacebookMessages(config: any): Promise<unknown[]> {
    // Facebook Messenger API message fetching
    return [];
  }

  private async fetchInstagramMessages(config: any): Promise<unknown[]> {
    // Instagram DM API message fetching
    return [];
  }
} 