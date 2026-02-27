/**
 * Chat API Route
 * 
 * Authorization:
 * - GET: Requires authentication (all roles)
 * - POST: Requires authentication (send message)
 * 
 * Customer Scoping: Customers see only their support chats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

import { AIBrainService, AIContext } from '@/lib/services/ai-brain.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { SalesVelocityService } from '@/lib/services/sales-velocity.service';

/**
 * GET /api/chat
 * Get chat messages
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const { searchParams } = new URL(req.url);
      const conversationId = searchParams.get('id');

      if (conversationId) {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { organizationId: organizationId as string },
              { customerId: user.id } // Simple check, might need better customer ID mapping
            ]
          },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        return NextResponse.json(successResponse(conversation));
      }

      const conversations = await prisma.conversation.findMany({
        where: user.role === 'CUSTOMER'
          ? { customerId: user.id }
          : { organizationId: organizationId as string },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
      });

      return NextResponse.json(successResponse(conversations));
    } catch (error: any) {
      logger.error({ message: 'Failed to fetch chats', error });
      return NextResponse.json({ success: false, message: 'Failed to fetch chats' }, { status: 500 });
    }
  }
);

/**
 * POST /api/chat
 * Send chat message
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { message, conversationId, toAI = false } = body;

      if (!message) throw new ValidationError('Message is required');

      let convoId = conversationId;
      const organizationId = getOrganizationScope(user) || 'default-org';

      // 1. Create or verify conversation
      if (!convoId) {
        const newConvo = await prisma.conversation.create({
          data: {
            organizationId,
            customerId: user.role === 'CUSTOMER' ? user.id : undefined,
            type: toAI ? 'AI' : 'SUPPORT'
          }
        });
        convoId = newConvo.id;
      }

      // 2. Save user message
      const userMsg = await prisma.conversationMessage.create({
        data: {
          conversationId: convoId,
          senderId: user.id,
          senderRole: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'HUMAN',
          content: message
        }
      });

      // 3. AI Response if requested
      let aiResponse;
      if (toAI) {
        // Fetch context for AI
        const [inventory, velocity] = await Promise.all([
          InventoryService.getInventory({ organizationId, limit: 5 }),
          SalesVelocityService.getOrganizationVelocity(organizationId)
        ]);

        const context: AIContext = {
          inventory: inventory.products,
          salesVelocity: velocity,
          analytics: { todayDate: new Date().toISOString() }
        };

        const aiDecision = await AIBrainService.decideNextAction(context);

        aiResponse = await prisma.conversationMessage.create({
          data: {
            conversationId: convoId,
            senderRole: 'AI',
            content: `[AI Decision: ${aiDecision.action}] ${aiDecision.reason}`,
            metadata: aiDecision.data as any
          }
        });
      }

      return NextResponse.json(successResponse({
        userMessage: userMsg,
        aiMessage: aiResponse,
        conversationId: convoId
      }), { status: 201 });

    } catch (error: any) {
      logger.error({ message: 'Failed to send chat message', error });
      return NextResponse.json({ success: false, message: 'Failed to send chat message' }, { status: 500 });
    }
  }
);
