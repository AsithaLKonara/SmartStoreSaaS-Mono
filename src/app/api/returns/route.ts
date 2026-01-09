/**
 * Returns API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_ORDERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (CREATE_ORDERS permission for return requests)
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
 * GET /api/returns
 * List returns with organization scoping
 */
export const GET = requirePermission('VIEW_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const orderId = searchParams.get('orderId');
    
      // Build where clause
      const where: any = { organizationId };
      if (status) where.status = status;
      if (orderId) where.orderId = orderId;

      // Query returns from database
      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            order: {
              select: {
                orderNumber: true,
                customer: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }),
        prisma.return.count({ where })
      ]);

      logger.info({
        message: 'Returns fetched',
        context: {
          userId: user.id,
          organizationId,
          count: returns.length,
          page,
          limit,
          status,
          orderId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(returns, {
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
        message: 'Failed to fetch returns',
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
        message: 'Failed to fetch returns',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/returns
 * Create return request
 */
export const POST = requirePermission('CREATE_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { orderId, reason, items, customerNotes } = body;

      // Validate required fields
      if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Order ID, reason, and items are required', {
          fields: {
            orderId: !orderId,
            reason: !reason,
            items: !items || !Array.isArray(items) || items.length === 0
          }
        });
      }

      // TODO: Implement actual return request creation
      // This would typically involve:
      // 1. Validating order and items
      // 2. Creating return request in database
      // 3. Sending notifications
      // 4. Returning return request details

      const returnRequest = {
        id: `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        customerId: user.id,
        reason,
        items,
        customerNotes: customerNotes || '',
        status: 'pending',
        organizationId,
        requestedAt: new Date().toISOString()
      };

      logger.info({
        message: 'Return request created',
        context: {
          userId: user.id,
          orderId,
          itemCount: items.length,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(returnRequest), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create return request',
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
        message: 'Failed to create return request',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);