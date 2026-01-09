/**
 * Support API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (CREATE_SUPPORT_TICKET permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support
 * List support tickets with organization scoping
 */
export const GET = requirePermission('VIEW_SUPPORT')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const category = searchParams.get('category');

      // Get organization scoping
      const orgId = getOrganizationScope(user);
      
      // Build where clause
      const where: any = {};
      
      // Add organization filter (CRITICAL: prevents cross-tenant data leaks)
      if (orgId) {
        where.organizationId = orgId;
      }
      
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
          userId: user.id,
          organizationId: orgId,
          count: tickets.length,
          total,
          page,
          limit,
          status,
          priority,
          category
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(tickets, {
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
      );
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
 * POST /api/support
 * Create support ticket with organization scoping
 * Note: CUSTOMER can create their own tickets, others need MANAGE_SUPPORT
 */
export const POST = requirePermission('CREATE_SUPPORT_TICKET')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { subject, description, priority, category } = body;

      // Validation
      if (!subject || !description) {
        throw new ValidationError('Subject and description are required', {
          fields: { subject: !subject, description: !description }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Create ticket in database
      const ticket = await prisma.support_tickets.create({
        data: {
          id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: subject,
          description,
          status: 'open',
          priority: priority || 'medium',
          email: user.email || '',
          organizationId,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Support ticket created',
        context: {
          userId: user.id,
          ticketId: ticket.id,
          subject,
          priority,
          category,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(ticket),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Support ticket creation failed',
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
        message: 'Support ticket creation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

