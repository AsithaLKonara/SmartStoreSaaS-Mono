import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Conversation creation schema
const createConversationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  channel: z.enum(['CHAT', 'EMAIL', 'WHATSAPP', 'PHONE', 'SMS']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  initialMessage: z.string().min(10, 'Initial message must be at least 10 characters'),
  tags: z.array(z.string()).optional(),
  assignedAgentId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// GET /api/chat/conversations - List conversations with pagination and filters
async function getConversations(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const channel = searchParams.get('channel');
    const assignedAgentId = searchParams.get('assignedAgentId');
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: any = {
      organizationId: (request as any).user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (channel) where.channel = channel;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId;
    if (customerId) where.customerId = customerId;

    // Get total count for pagination
    const total = await prisma.customerConversation.count({ where });
    
    // Get conversations with pagination
    const conversations = await prisma.customerConversation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        // assignedAgent include removed - not in schema
        messages: {
          select: {
            id: true,
            content: true,

            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1 // Get only the latest message
        }
      }
    });

    // Calculate conversation statistics
    const conversationsWithStats = conversations.map((conversation: any) => {
      const messageCount = conversation.messages.length;
      const lastMessage = conversation.messages[0];
      const isUnread = conversation.status === 'OPEN';
      
      return {
        ...conversation,
        stats: {
          messageCount,
          lastMessage,
          isUnread
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversationsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
async function createConversation(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createConversationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const conversationData = validationResult.data;

    // Verify customer exists and belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: conversationData.customerId,
        organizationId: (request as any).user!.organizationId
      }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        subject: conversationData.subject,
        priority: conversationData.priority || 'MEDIUM',
        organization: {
          connect: { id: (request as any).user!.organizationId }
        },
        customer: {
          connect: { id: conversationData.customerId }
        },
        status: 'active'
      }
    });

    // Create initial message
    await prisma.chatMessage.create({
      data: {
        conversation: {
          connect: { id: conversation.id }
        },
        content: conversationData.initialMessage,
        direction: 'INBOUND',
        customer: {
          connect: { id: customer.id }
        },
        organization: {
          connect: { id: (request as any).user!.organizationId }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CONVERSATION_CREATED',
        description: `Conversation "${conversation.subject}" created with ${customer.name}`,
        user: {
          connect: { id: (request as any).user!.userId }
        },
        metadata: {
          conversationId: conversation.id,
          customerId: customer.id,
          customerName: customer.name,
          channel: conversationData.channel,
          priority: conversationData.priority
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { conversation },
      message: 'Conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getConversations);
export const POST = withProtection(['ADMIN', 'MANAGER', 'STAFF'])(createConversation);