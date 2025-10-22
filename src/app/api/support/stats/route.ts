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

    const organizationId = session.user.organizationId;

    // Query actual statistics from database
    const [
      totalTickets,
      openTickets,
      closedTickets,
      ticketsByStatus,
      ticketsByPriority,
      recentTickets
    ] = await Promise.all([
      prisma.support_tickets.count({ where: { organizationId } }),
      prisma.support_tickets.count({ where: { organizationId, status: 'open' } }),
      prisma.support_tickets.count({ where: { organizationId, status: 'closed' } }),
      prisma.support_tickets.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true }
      }),
      prisma.support_tickets.groupBy({
        by: ['priority'],
        where: { organizationId },
        _count: { id: true }
      }),
      prisma.support_tickets.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, updatedAt: true }
      })
    ]);

    const stats = {
      totalTickets,
      openTickets,
      closedTickets,
      inProgressTickets: ticketsByStatus.find(s => s.status === 'in_progress')?._count.id || 0,
      ticketsByStatus: ticketsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      ticketsByPriority: ticketsByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: recentTickets.map(ticket => ({
        id: ticket.id,
        type: 'ticket_activity',
        description: `Ticket: ${ticket.title}`,
        status: ticket.status,
        timestamp: ticket.updatedAt.toISOString()
      }))
    };

    logger.info({
      message: 'Support statistics fetched',
      context: {
        userId: session.user.id,
        organizationId,
        totalTickets
      }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch support statistics',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

