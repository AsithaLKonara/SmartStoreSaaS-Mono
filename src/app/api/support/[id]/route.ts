/**
 * Single Support Ticket API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT permission), CUSTOMER (their own tickets)
 * - PATCH: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPORT permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/[id]
 * Get single support ticket with organization scoping
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_SUPPORT')(
    async (req: AuthenticatedRequest, user) => {
      try {
        // Query ticket from database
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId },
          include: {
            replies: true
          }
        });

        if (!ticket) {
          throw new NotFoundError('Support ticket not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, ticket.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot view support tickets from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        // CUSTOMER can only view their own tickets
        if (user.role === 'CUSTOMER' && ticket.email !== user.email) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot view other customers\' support tickets',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        logger.info({
          message: 'Support ticket fetched',
          context: {
            userId: user.id,
            ticketId,
            organizationId: ticket.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(ticket));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch support ticket',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            ticketId,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch support ticket',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * PATCH /api/support/[id]
 * Update support ticket with organization scoping
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_SUPPORT')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { status, priority, assignedTo, message } = body;

        // Get ticket first
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          throw new NotFoundError('Support ticket not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, ticket.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot update support tickets from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        // Update ticket
        const updateData: any = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (assignedTo) updateData.assignedTo = assignedTo;
        updateData.updatedAt = new Date();

        const updatedTicket = await prisma.support_tickets.update({
          where: { id: ticketId },
          data: updateData
        });

        // Add reply if message provided
        if (message) {
          await prisma.support_replies.create({
            data: {
              id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ticketId,
              message,
              authorId: user.id,
              authorName: user.name || user.email,
              isInternal: false,
              createdAt: new Date()
            }
          });
        }

        logger.info({
          message: 'Support ticket updated',
          context: {
            userId: user.id,
            ticketId,
            organizationId: ticket.organizationId,
            status,
            priority,
            assignedTo
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(updatedTicket));
      } catch (error: any) {
        logger.error({
          message: 'Support ticket update failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            ticketId,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Support ticket update failed',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * DELETE /api/support/[id]
 * Delete support ticket with organization scoping
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_SUPPORT')(
    async (req: AuthenticatedRequest, user) => {
      try {
        // Get ticket first
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          throw new NotFoundError('Support ticket not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, ticket.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot delete support tickets from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        // Delete replies first (cascade)
        await prisma.support_replies.deleteMany({
          where: { ticketId }
        });

        // Delete ticket
        await prisma.support_tickets.delete({
          where: { id: ticketId }
        });

        logger.info({
          message: 'Support ticket deleted',
          context: {
            userId: user.id,
            ticketId,
            organizationId: ticket.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Support ticket deleted successfully',
          ticketId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Support ticket deletion failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            ticketId,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Support ticket deletion failed',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

