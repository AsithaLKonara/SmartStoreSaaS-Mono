/**
 * Support Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT_TICKETS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/stats
 * Get support ticket statistics
 */
export const GET = requirePermission('VIEW_SUPPORT_TICKETS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

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
          userId: user.id,
          organizationId,
          totalTickets
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(stats));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support statistics',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch support statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

