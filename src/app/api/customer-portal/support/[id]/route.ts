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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const ticketId = params.id;
    // TODO: Find customer record and verify ownership
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId }
      // TODO: Add replies include when available
      // include: { replies: true }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Support ticket not found' }, { status: 404 });
    }

    logger.info({
      message: 'Support ticket fetched',
      context: { ticketId, userId: session.user.id }
    });

    return NextResponse.json(successResponse(ticket));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch support ticket',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    // TODO: Find customer record and verify ownership
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Support ticket not found' }, { status: 404 });
    }

    // TODO: Add reply to ticket
    logger.info({
      message: 'Support ticket reply added',
      context: { ticketId, userId: session.user.id }
    });

    return NextResponse.json(successResponse({
      message: 'Reply added successfully',
      ticketId
    }));
  } catch (error: any) {
    logger.error({
      message: 'Failed to add ticket reply',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}