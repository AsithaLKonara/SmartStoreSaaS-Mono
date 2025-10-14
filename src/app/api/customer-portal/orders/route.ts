/**
 * Customer Portal Orders API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (VIEW_OWN_ORDERS permission)
 * 
 * Customer Scoping:
 * - Returns only orders belonging to the authenticated customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      // CRITICAL: Find customer record for this user
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        logger.warn({
          message: 'Customer record not found for user',
          context: {
            userId: user.id,
            email: user.email
          }
        });
        
        return NextResponse.json(
          successResponse([], { total: 0, page, limit, totalPages: 0 })
        );
      }

      // CRITICAL: Only fetch this customer's orders
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: {
            customerId: customer.id, // CRITICAL: customer scoping
            organizationId: user.organizationId // CRITICAL: org scoping
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            subtotal: true,
            tax: true,
            shipping: true,
            discount: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.order.count({
          where: {
            customerId: customer.id,
            organizationId: user.organizationId
          }
        })
      ]);

      logger.info({
        message: 'Customer orders fetched',
        context: {
          userId: user.id,
          customerId: customer.id,
          count: orders.length
        }
      });

      return NextResponse.json(
        successResponse(orders, {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer orders',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole('CUSTOMER')(
  async (request, user) => {
    return NextResponse.json(
      successResponse({
        message: 'Customer cannot create orders directly',
        status: 'use_checkout_endpoint'
      })
    );
  }
);
