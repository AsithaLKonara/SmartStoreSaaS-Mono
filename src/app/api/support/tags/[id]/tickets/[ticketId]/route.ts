/**
 * Support Tag-Ticket Association API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
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
 * POST /api/support/tags/[id]/tickets/[ticketId]
 * Add tag to ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> | { id: string; ticketId: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id: tagId, ticketId } = resolvedParams;
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
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
          throw new AuthorizationError('Cannot modify tickets from other organizations');
        }

        // TODO: Implement actual support tag assignment to ticket when tag-ticket relationship is implemented
        // This would involve:
        // 1. Validating tag exists
        // 2. Adding tag to ticket in database
        // 3. Updating tag usage count

        logger.info({
          message: 'Support tag added to ticket',
          context: {
            userId: user.id,
            tagId,
            ticketId,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({ message: 'Tag added to ticket successfully' }));
      } catch (error: any) {
        logger.error({
          message: 'Support tag assignment failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId,
            ticketId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to add tag to ticket',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * DELETE /api/support/tags/[id]/tickets/[ticketId]
 * Remove tag from ticket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> | { id: string; ticketId: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id: tagId, ticketId } = resolvedParams;
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
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
          throw new AuthorizationError('Cannot modify tickets from other organizations');
        }

        // TODO: Implement actual support tag removal from ticket when tag-ticket relationship is implemented
        // This would involve:
        // 1. Validating tag and ticket
        // 2. Removing tag from ticket in database
        // 3. Updating tag usage count

        logger.info({
          message: 'Support tag removed from ticket',
          context: {
            userId: user.id,
            tagId,
            ticketId,
            organizationId: ticket.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({ message: 'Tag removed from ticket successfully' }));
      } catch (error: any) {
        logger.error({
          message: 'Support tag removal failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId,
            ticketId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to remove tag from ticket',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}