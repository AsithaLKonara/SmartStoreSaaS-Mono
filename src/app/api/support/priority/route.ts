/**
 * Support Ticket Priority Update API Route
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
 * POST /api/support/priority
 * Update support ticket priority
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { ticketId, priority } = body;

        // Validate required fields
        if (!ticketId || !priority) {
          throw new ValidationError('Ticket ID and priority are required', {
            fields: { ticketId: !ticketId, priority: !priority }
          });
        }

        // Validate priority value
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
          throw new ValidationError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
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
          throw new AuthorizationError('Cannot update priority for tickets from other organizations');
        }

        // Update ticket priority
        const updatedTicket = await prisma.support_tickets.update({
          where: { id: ticketId },
          data: {
            priority,
            updatedAt: new Date()
          }
        });

        logger.info({
          message: 'Support ticket priority updated',
          context: {
            userId: user.id,
            ticketId,
            priority,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updatedTicket));
      } catch (error: any) {
        logger.error({
          message: 'Support ticket priority update failed',
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
          message: 'Failed to update support ticket priority',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

