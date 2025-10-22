import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    const organizationId = session.user.organizationId;
    
    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    
    // Query database
    const [tickets, total] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.support_tickets.count({ where })
    ]);

    logger.info({
      message: 'Support tickets fetched',
      context: {
        userId: session.user.id,
        organizationId,
        count: tickets.length,
        total,
        page,
        limit,
        status,
        priority,
        category
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch support tickets',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, priority, category } = body;

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json({
        success: false,
        error: 'Subject and description are required'
      }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'User must belong to an organization'
      }, { status: 400 });
    }

    // Create ticket in database
    const ticket = await prisma.support_tickets.create({
      data: {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: subject,
        description,
        status: 'open',
        priority: priority || 'medium',
        email: session.user.email || '',
        organizationId,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Support ticket created',
      context: {
        userId: session.user.id,
        ticketId: ticket.id,
        subject,
        priority,
        category,
        organizationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });

  } catch (error: any) {
    logger.error({
      message: 'Support ticket creation failed',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Support ticket creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

