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
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const where: any = {};
      
      if (user.role === 'CUSTOMER') {
        // Customers see only their chats
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (customer) {
          where.customerId = customer.id;
        }
      } else {
        // Staff/Admin see chats for their organization
        where.organizationId = user.organizationId;
      }

      const chats = await prisma.chat.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Chats fetched',
        context: { userId: user.id, count: chats.length }
      });

      return NextResponse.json(successResponse(chats));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch chats',
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
      const { message, conversationId } = body;

      if (!message) {
        throw new ValidationError('Message is required');
      }

      logger.info({
        message: 'Chat message sent',
        context: {
          userId: user.id,
          conversationId
        }
      });

      // TODO: Save actual message
      return NextResponse.json(successResponse({
        messageId: `msg_${Date.now()}`,
        message,
        sentAt: new Date().toISOString()
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to send chat message',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
