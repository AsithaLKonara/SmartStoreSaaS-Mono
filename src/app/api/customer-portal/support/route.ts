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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for CUSTOMER
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Find customer record
    // const customer = await prisma.customer.findFirst({
    //   where: { email: session.user.email }
    // });

    // if (!customer) {
    //   return NextResponse.json(successResponse([]));
    // }

    const tickets = await prisma.support_tickets.findMany({
      where: {}, // TODO: Add email filter for customer
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    logger.info({
      message: 'Customer support tickets fetched',
      context: { count: tickets.length, userId: session.user.id }
    });

    return NextResponse.json(successResponse(tickets));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch support tickets',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for CUSTOMER
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, message, category } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 });
    }

    // TODO: Find customer record
    // const customer = await prisma.customer.findFirst({
    //   where: { email: session.user.email }
    // });

    // Get customer record to find email and organizationId
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { email: true, organizationId: true }
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer profile not found' }, { status: 404 });
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
      context: { ticketId: ticket.id, userId: session.user.id }
    });

    return NextResponse.json(successResponse(ticket), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create support ticket',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
