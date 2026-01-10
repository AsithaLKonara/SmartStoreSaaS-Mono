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
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat
 * Get chat messages (authenticated users, role-based filtering)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const where: any = {};
      
      // Role-based filtering
      if (user.role === 'CUSTOMER') {
        // Customers see only their chats
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (customer) {
          where.customerId = customer.id;
        }
      } else if (organizationId) {
        // Staff/Admin see chats for their organization
        where.organizationId = organizationId;
      }

      // TODO: Implement chat model when available
      // const chats = await prisma.chat.findMany({
      //   where,
      //   orderBy: { updatedAt: 'desc' },
      //   take: 50
      // });
      const chats: any[] = [];

      logger.info({
        message: 'Chats fetched',
        context: {
          userId: user.id,
          organizationId,
          role: user.role,
          count: chats.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(chats));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch chats',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch chats',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/chat
 * Send chat message (authenticated users)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { message, conversationId } = body;

      if (!message) {
        throw new ValidationError('Message is required', {
          fields: { message: !message }
        });
      }

      logger.info({
        message: 'Chat message sent',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          conversationId
        },
        correlation: req.correlationId
      });

      // TODO: Save actual message
      return NextResponse.json(successResponse({
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message,
        sentAt: new Date().toISOString()
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to send chat message',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to send chat message',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
