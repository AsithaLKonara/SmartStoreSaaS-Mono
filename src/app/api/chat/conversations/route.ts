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
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const where: any = {};

      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (customer) {
          where.customerId = customer.id;
        }
      } else {
        where.organizationId = user.organizationId;
      }

      const conversations = await prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Conversations fetched',
        context: { userId: user.id, count: conversations.length }
      });

      return NextResponse.json(successResponse(conversations));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch conversations',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { subject, message } = body;

      if (!subject || !message) {
        throw new ValidationError('Subject and message are required');
      }

      logger.info({
        message: 'Conversation created',
        context: { userId: user.id, subject }
      });

      // TODO: Create actual conversation
      return NextResponse.json(successResponse({
        conversationId: `conv_${Date.now()}`,
        subject,
        createdAt: new Date().toISOString()
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create conversation',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
