/**
 * Support Ticket Replies API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT_TICKETS permission), CUSTOMER (their own tickets)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission), CUSTOMER (CREATE_SUPPORT_TICKET for their own tickets)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/[id]/replies
 * Get replies for a support ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // Fetch ticket to validate access
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          throw new NotFoundError('Support ticket not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, ticket.organizationId)) {
          throw new AuthorizationError('Cannot view replies for tickets from other organizations');
        }

        // CUSTOMER can only view their own ticket replies
        if (user.role === 'CUSTOMER' && ticket.email !== user.email) {
          throw new AuthorizationError('Cannot view replies for other customers\' tickets');
        }

        // Fetch replies from database
        const [replies, total] = await Promise.all([
          prisma.support_replies.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit
          }),
          prisma.support_replies.count({ where: { ticketId } })
        ]);

        logger.info({
          message: 'Support ticket replies fetched',
          context: {
            userId: user.id,
            ticketId,
            count: replies.length,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(
          successResponse(replies, {
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          })
        );
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch support ticket replies',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            ticketId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch support ticket replies',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * POST /api/support/[id]/replies
 * Create reply for a support ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;
  
  // CUSTOMER can create replies for their own tickets, others need MANAGE_SUPPORT_TICKETS
  const handler = requirePermission('CREATE_SUPPORT_TICKET')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { message, isInternal = false } = body;

        // Validate required fields
        if (!message) {
          throw new ValidationError('Message is required');
        }

        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // Fetch ticket to validate access
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          throw new NotFoundError('Support ticket not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, ticket.organizationId)) {
          throw new AuthorizationError('Cannot add replies to tickets from other organizations');
        }

        // CUSTOMER can only reply to their own tickets
        if (user.role === 'CUSTOMER' && ticket.email !== user.email) {
          throw new AuthorizationError('Cannot reply to other customers\' tickets');
        }

        // Create reply in database
        const reply = await prisma.support_replies.create({
          data: {
            id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ticketId,
            message,
            author: user.id,
            authorName: user.name || 'Unknown User',
            isInternal: isInternal && user.role !== 'CUSTOMER', // Customers cannot create internal replies
            createdAt: new Date()
          }
        });

        // Update ticket last activity
        await prisma.support_tickets.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() }
        });

        logger.info({
          message: 'Support ticket reply created',
          context: {
            userId: user.id,
            ticketId,
            replyId: reply.id,
            isInternal,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(reply));
      } catch (error: any) {
        logger.error({
          message: 'Support ticket reply creation failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            ticketId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to create support ticket reply',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

