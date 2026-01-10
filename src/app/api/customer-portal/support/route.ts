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
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/support
 * Get customer support tickets (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Find customer record
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      const tickets = await prisma.support_tickets.findMany({
        where: { email: customer.email },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Customer support tickets fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          customerId: customer.id,
          count: tickets.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(tickets));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support tickets',
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
        message: 'Failed to fetch support tickets',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customer-portal/support
 * Create support ticket (authenticated customer)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { subject, message, category } = body;

      if (!subject || !message) {
        throw new ValidationError('Subject and message are required', {
          fields: { subject: !subject, message: !message }
        });
      }

      // Get customer record to find email and organizationId
      const customer = await prisma.customer.findFirst({
        where: { email: user.email },
        select: { email: true, organizationId: true }
      });

      if (!customer) {
        throw new NotFoundError('Customer profile not found');
      }

      const ticket = await prisma.support_tickets.create({
        data: {
          id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: subject,
          description: message,
          priority: 'medium',
          status: 'open',
          email: customer.email,
          organizationId: customer.organizationId,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Support ticket created',
        context: {
          userId: user.id,
          organizationId: customer.organizationId,
          ticketId: ticket.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(ticket), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create support ticket',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create support ticket',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
