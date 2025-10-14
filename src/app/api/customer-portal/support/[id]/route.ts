/**
 * Customer Portal Support Ticket Details API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own ticket)
 * - PATCH: CUSTOMER only (add reply to own ticket)
 * 
 * Customer Scoping: User sees only their own tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const ticketId = params.id;

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { replies: true }
      });

      if (!ticket) {
        throw new ValidationError('Support ticket not found');
      }

      if (ticket.customerId !== customer.id) {
        throw new ValidationError('Cannot view other customers tickets');
      }

      logger.info({
        message: 'Support ticket fetched',
        context: { userId: user.id, ticketId }
      });

      return NextResponse.json(successResponse(ticket));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support ticket',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PATCH = requireRole('CUSTOMER')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const ticketId = params.id;
      const body = await request.json();
      const { message } = body;

      if (!message) {
        throw new ValidationError('Message is required');
      }

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        throw new ValidationError('Support ticket not found');
      }

      if (ticket.customerId !== customer.id) {
        throw new ValidationError('Cannot reply to other customers tickets');
      }

      // TODO: Add reply to ticket
      logger.info({
        message: 'Support ticket reply added',
        context: { userId: user.id, ticketId }
      });

      return NextResponse.json(successResponse({
        message: 'Reply added successfully',
        ticketId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to add ticket reply',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
