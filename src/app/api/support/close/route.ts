/**
 * Support Ticket Close API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
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
 * POST /api/support/close
 * Close support ticket
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { ticketId, resolution, satisfaction } = body;

        // Validate required fields
        if (!ticketId) {
          throw new ValidationError('Ticket ID is required');
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
          throw new AuthorizationError('Cannot close tickets from other organizations');
        }

        // Update ticket status
        const updatedTicket = await prisma.support_tickets.update({
          where: { id: ticketId },
          data: {
            status: 'closed',
            resolution: resolution || 'Resolved',
            satisfaction: satisfaction || null,
            closedAt: new Date(),
            updatedAt: new Date()
          }
        });

        logger.info({
          message: 'Support ticket closed',
          context: {
            userId: user.id,
            ticketId,
            resolution,
            satisfaction,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updatedTicket));
      } catch (error: any) {
        logger.error({
          message: 'Support ticket closing failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to close support ticket',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

