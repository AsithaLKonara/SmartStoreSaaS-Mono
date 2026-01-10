/**
 * Chat Conversations API Route
 * 
 * Authorization:
 * - GET: Requires authentication
 * - POST: Requires authentication (create new conversation)
 * 
 * Customer Scoping: Customers see only their conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/conversations
 * Get chat conversations (authenticated users, role-based filtering)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const where: any = {};

      // Role-based filtering
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (customer) {
          where.customerId = customer.id;
        }
      } else if (organizationId) {
        where.organizationId = organizationId;
      }

      const conversations = await prisma.ai_conversations.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Conversations fetched',
        context: {
          userId: user.id,
          organizationId,
          role: user.role,
          count: conversations.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(conversations));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch conversations',
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
        message: 'Failed to fetch conversations',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/chat/conversations
 * Create chat conversation (authenticated users)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const body = await req.json();
      const { subject, message } = body;

      if (!subject || !message) {
        throw new ValidationError('Subject and message are required', {
          fields: { subject: !subject, message: !message }
        });
      }

      logger.info({
        message: 'Conversation created',
        context: {
          userId: user.id,
          organizationId,
          subject
        },
        correlation: req.correlationId
      });

      // TODO: Create actual conversation
      return NextResponse.json(successResponse({
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject,
        createdAt: new Date().toISOString()
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create conversation',
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
        message: 'Failed to create conversation',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
