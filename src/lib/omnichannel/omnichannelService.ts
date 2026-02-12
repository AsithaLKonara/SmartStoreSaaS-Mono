import { prisma } from '@/lib/prisma';

export interface ChannelMessage {
  id: string;
  channel: string;
  message: string;
  timestamp: Date;
  isIncoming: boolean;
  status: string;
  metadata?: unknown;
}

export interface CustomerConversation {
  id: string;
  customerId: string;
  channel: string;
  messages: ChannelMessage[];
  status: string;
  assignedAgent?: string | null;
  priority: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  assignedAgentId?: string | null;
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
    const conversations = await prisma.customerConversation.findMany({
      where: { organizationId },
      include: {
        customer: true,
        assignedAgent: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform Prisma results to match interface
    const transformedConversations: CustomerConversation[] = conversations.map((c: any) => ({
      id: c.id,
      customerId: c.customerId,
      channel: c.channel,
      messages: c.messages || [],
      status: c.status,
      assignedAgent: c.assignedAgent?.id || null,
      priority: c.priority,
      tags: c.tags || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      organizationId: c.organizationId,
      assignedAgentId: c.assignedAgentId
    }));

    const unreadCount = transformedConversations.filter((c: any) =>
      c.messages.some((m: any) => !m.isIncoming && m.status === 'sent')
    ).length;

    const pendingCount = transformedConversations.filter((c: any) => c.status === 'pending').length;
    const urgentCount = transformedConversations.filter((c: any) => c.priority === 'urgent').length;

    return {
      conversations: transformedConversations,
      unreadCount,
      pendingCount,
      urgentCount
    };
  }

  async getConversation(conversationId: string): Promise<CustomerConversation | null> {
    const conversation = await prisma.customerConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        customer: true,
        assignedAgent: true
      }
    });

    if (!conversation) return null;

    // Transform Prisma result to match interface
    return {
      id: conversation.id,
      customerId: conversation.customerId ?? '', // Fix null safety
      channel: conversation.channel,
      messages: conversation.messages || [],
      status: conversation.status,
      assignedAgent: conversation.assignedAgent?.id || null,
      priority: conversation.priority,
      tags: conversation.tags || [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      organizationId: conversation.organizationId,
      assignedAgentId: conversation.assignedAgentId
    };
  }

  async sendMessage(conversationId: string, message: string, channel: string): Promise<ChannelMessage> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Send message through appropriate channel
    const sentMessage = await this.sendToChannel(channel, conversation.customerId, message);

    // Save message to database
    const savedMessage = await prisma.channelMessage.create({
      data: {
        conversationId,
        channel,
        message,
        content: message, // Add content field
        timestamp: new Date(),
        isIncoming: false,
        status: 'sent',
        metadata: sentMessage
      }
    });

    // Update conversation
    await prisma.customerConversation.update({
      where: { id: conversationId },
      data: {
        status: 'active',
        // updatedAt is automatically updated by @updatedAt
      }
    });

    return {
      id: savedMessage.id,
      channel: savedMessage.channel,
      message: savedMessage.message,
      timestamp: savedMessage.timestamp,
      isIncoming: savedMessage.isIncoming,
      status: savedMessage.status,
      metadata: savedMessage.metadata
    };
  }

  async assignAgent(conversationId: string, agentId: string): Promise<void> {
    await prisma.customerConversation.update({
      where: { id: conversationId },
      data: { assignedAgentId: agentId }
    });
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<void> {
    await prisma.customerConversation.update({
      where: { id: conversationId },
      data: { status }
    });
  }

  async addConversationTags(conversationId: string, tags: string[]): Promise<void> {
    const conversation = await prisma.customerConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) return;

    const updatedTags = Array.from(new Set([...conversation.tags, ...tags]));

    await prisma.customerConversation.update({
      where: { id: conversationId },
      data: { tags: updatedTags }
    });
  }

  async getChannelIntegrations(organizationId: string): Promise<ChannelIntegration[]> {
    const integrations = await prisma.channel_integrations.findMany({
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
    const existing = await prisma.channel_integrations.findFirst({
      where: { organizationId, channel }
    });

    if (existing) {
      // Update existing
      await prisma.channel_integrations.update({
        where: { id: existing.id },
        data: {
          config,
          lastSync: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      await prisma.channel_integrations.create({
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
    const integration = await prisma.channel_integrations.findFirst({ // Fix: Use findFirst instead of findUnique
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
    await prisma.channel_integrations.update({
      where: { id: integration.id },
      data: { lastSync: new Date() }
    });
  }

  async getCustomerHistory(customerId: string): Promise<CustomerConversation[]> {
    const conversations = await prisma.customerConversation.findMany({
      where: { customerId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform Prisma results to match interface
    return conversations.map((c: any) => ({
      id: c.id,
      customerId: c.customerId || '',
      channel: c.channel,
      messages: c.messages || [],
      status: c.status,
      assignedAgent: c.assignedAgent?.id || null,
      priority: c.priority,
      tags: c.tags || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      organizationId: c.organizationId,
      assignedAgentId: c.assignedAgentId
    }));
  }

  async createConversation(customerId: string, channel: string, initialMessage: string): Promise<CustomerConversation> {
    const conversation = await prisma.customerConversation.create({
      data: {
        customerId,
        channel,
        status: 'active',
        priority: 'medium',
        tags: [],
        organizationId: 'default-org' // You should implement proper organization resolution
        // Note: messages relationship doesn't exist in Prisma schema
        // Consider implementing this functionality when the relationship is available
      },
      include: {
        messages: true,
        customer: true
      }
    });

    // Transform to match interface
    return {
      id: conversation.id,
      customerId: conversation.customerId || '',
      channel: conversation.channel,
      messages: conversation.messages || [],
      status: conversation.status,
      assignedAgent: null,
      priority: conversation.priority,
      tags: conversation.tags || [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      organizationId: conversation.organizationId,
      assignedAgentId: conversation.assignedAgentId
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
    let conversation: unknown = await prisma.customerConversation.findFirst({
      where: {
        customerId: (message.customerId) || undefined, // Fix null safety - use undefined instead of null
        channel,
        status: { in: ['active', 'pending'] }
      },
      include: {
        messages: true,
        customer: true // include customer to satisfy CustomerConversation type if needed
      }
    });

    let customerConversation = conversation as any;

    if (!customerConversation) {
      // Create a conversation but cast the result to any or specific internal type so we can continue
      const newConversation = await this.createConversation(message.customerId, channel, message.text);
      customerConversation = newConversation as any; // Cast for now to proceed
    }

    // Ensure conversation exists
    if (!customerConversation) {
      throw new Error('Failed to create or find conversation');
    }

    // Save incoming message
    await prisma.channelMessage.create({
      data: {
        conversationId: customerConversation.id,
        conversation: {
          connect: { id: customerConversation.id }
        },
        channel,
        message: message.text,
        content: message.text, // Add content field
        timestamp: new Date(),
        isIncoming: true,
        status: 'delivered'
      },
    });

    // Update conversation
    await prisma.customerConversation.update({
      where: { id: customerConversation.id },
      data: {
        status: 'active',
        // updatedAt is automatically updated by @updatedAt
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