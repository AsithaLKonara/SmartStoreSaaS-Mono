export const dynamic = 'force-dynamic';
import { AuthenticatedRequest, withProtection } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { 
  CommonErrors,
  generateRequestId,
  getRequestPath
} from '@/lib/error-handling';

// Conversation creation schema
const createConversationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  channel: z.enum(['CHAT', 'EMAIL', 'WHATSAPP', 'PHONE', 'SMS']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  initialMessage: z.string().min(10, 'Initial message must be at least 10 characters'),
  tags: z.array(z.string()).optional(),
  assignedAgentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// GET /api/chat/conversations - List conversations with pagination and filters
async function getConversations(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedAgentId = searchParams.get('assignedAgentId');
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: Prisma.ChatConversationWhereInput = {
      organizationId: request.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (assignedAgentId) where.assignedAgent = { id: assignedAgentId };
    if (customerId) where.customerId = customerId;

    // Get total count for pagination
    const total = await prisma.chatConversation.count({ where });
    
    // Get conversations with pagination
    const conversations = await prisma.chatConversation.findMany({
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
    const conversationsWithStats = conversations.map((conversation) => {
      const messageCount = conversation.messages?.length || 0;
      const lastMessage = conversation.messages?.[0] || null;
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

    const responseData = {
      conversations: conversationsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(responseData, 200, origin);

  } catch (error) {
    console.error('Error fetching conversations:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database query error',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// POST /api/chat/conversations - Create new conversation
async function createConversation(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createConversationSchema.safeParse(body);
    if (!validationResult.success) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.VALIDATION_ERROR(
        validationResult.error.errors,
        path,
        requestId
      );
    }

    const conversationData = validationResult.data;

    // Verify customer exists and belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: conversationData.customerId,
        organizationId: request.user!.organizationId
      }
    });

    if (!customer) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.NOT_FOUND('Customer', path, requestId);
    }

    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        subject: conversationData.subject,
        priority: conversationData.priority || 'MEDIUM',
        organization: {
          connect: { id: request.user!.organizationId }
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
          connect: { id: request.user!.organizationId }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CONVERSATION_CREATED',
        description: `Conversation "${conversation.subject}" created with ${customer.name}`,
        user: {
          connect: { id: request.user!.userId }
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

    const responseData = { conversation };

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(responseData, 201, origin);

  } catch (error) {
    console.error('Error creating conversation:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database operation failed',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// Export handlers with security middleware
export const GET = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  getConversations
);

export const POST = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  createConversation
);