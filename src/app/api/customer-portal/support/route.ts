/**
 * Customer Portal Support API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own support tickets)
 * - POST: CUSTOMER only (create support ticket)
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
  async (request, user) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      const tickets = await prisma.supportTicket.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Customer support tickets fetched',
        context: { userId: user.id, count: tickets.length }
      });

      return NextResponse.json(successResponse(tickets));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support tickets',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { subject, message, category } = body;

      if (!subject || !message) {
        throw new ValidationError('Subject and message are required');
      }

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          customerId: customer.id,
          organizationId: customer.organizationId,
          subject,
          message,
          category: category || 'GENERAL',
          status: 'OPEN',
          priority: 'MEDIUM'
        }
      });

      logger.info({
        message: 'Support ticket created',
        context: { userId: user.id, ticketId: ticket.id }
      });

      return NextResponse.json(successResponse(ticket), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create support ticket',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
