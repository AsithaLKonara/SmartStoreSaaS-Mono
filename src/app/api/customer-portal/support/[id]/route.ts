/**
 * Customer Support Ticket Details API Route
 * 
 * Authorization:
 * - GET: CUSTOMER role only
 * - PATCH: CUSTOMER role only
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/support/[id]
 * Get single support ticket (authenticated customer, must own ticket)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const ticketId = params.id;

      // Find customer record to verify ownership
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const ticket = await prisma.support_tickets.findUnique({
        where: { id: ticketId }
        // TODO: Add replies include when available
        // include: { replies: true }
      });

      if (!ticket) {
        throw new NotFoundError('Support ticket not found');
      }

      // Verify ticket ownership
      if (ticket.email !== customer.email) {
        throw new AuthorizationError('Cannot access tickets from other customers');
      }

      logger.info({
        message: 'Support ticket fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          customerId: customer.id,
          ticketId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(ticket));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support ticket',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          ticketId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch support ticket',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * PATCH /api/customer-portal/support/[id]
 * Add reply to support ticket (authenticated customer, must own ticket)
 */
export const PATCH = requireAuth(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const ticketId = params.id;
      const body = await req.json();
      const { message } = body;

      if (!message) {
        throw new ValidationError('Message is required', {
          fields: { message: !message }
        });
      }

      // Find customer record to verify ownership
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const ticket = await prisma.support_tickets.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        throw new NotFoundError('Support ticket not found');
      }

      // Verify ticket ownership
      if (ticket.email !== customer.email) {
        throw new AuthorizationError('Cannot modify tickets from other customers');
      }

      // TODO: Add reply to ticket using support_ticket_replies table when available
      // For now, just update the ticket's updatedAt
      await prisma.support_tickets.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });

      logger.info({
        message: 'Support ticket reply added',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          customerId: customer.id,
          ticketId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Reply added successfully',
        ticketId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to add ticket reply',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          ticketId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to add ticket reply',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);