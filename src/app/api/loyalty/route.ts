/**
 * Loyalty Program API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER
 *   - CUSTOMER sees only own loyalty data
 *   - Others see organization-scoped data
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (manage points)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get('customerId');

      if (user.role === 'CUSTOMER') {
        // Customer sees only their own loyalty
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });

        if (!customer) {
          return NextResponse.json(successResponse({ loyalty: null }));
        }

        const loyalty = await prisma.customerLoyalty.findUnique({
          where: { customerId: customer.id }
        });

        logger.info({
          message: 'Customer loyalty fetched',
          context: { userId: user.id, customerId: customer.id }
        });

        return NextResponse.json(successResponse(loyalty));
      }

      // Staff/Admin can query specific customer or all
      const orgId = getOrganizationScope(user);
      
      if (customerId) {
        const loyalty = await prisma.customerLoyalty.findUnique({
          where: { customerId },
          include: { customer: true }
        });

        if (loyalty && loyalty.customer.organizationId !== orgId && user.role !== 'SUPER_ADMIN') {
          throw new ValidationError('Cannot view loyalty data from other organizations');
        }

        return NextResponse.json(successResponse(loyalty));
      }

      // Get all loyalty records for organization
      const loyaltyRecords = await prisma.customerLoyalty.findMany({
        where: {
          customer: {
            organizationId: orgId
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info({
        message: 'Loyalty records fetched',
        context: { userId: user.id, count: loyaltyRecords.length }
      });

      return NextResponse.json(successResponse(loyaltyRecords));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch loyalty',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireAuth(
  async (request, user) => {
    try {
      if (user.role === 'CUSTOMER') {
        throw new ValidationError('Customers cannot modify loyalty points directly');
      }

      const body = await request.json();
      const { customerId, points, action = 'add', reason } = body;

      if (!customerId || points === undefined) {
        throw new ValidationError('Customer ID and points are required');
      }

      const loyalty = await prisma.customerLoyalty.findUnique({
        where: { customerId },
        include: { customer: true }
      });

      if (!loyalty) {
        throw new ValidationError('Loyalty record not found');
      }

      // Verify customer belongs to user's organization
      if (loyalty.customer.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot modify loyalty for other organizations');
      }

      const newPoints = action === 'add' 
        ? loyalty.points + points
        : loyalty.points - points;

      const updated = await prisma.customerLoyalty.update({
        where: { customerId },
        data: { points: Math.max(0, newPoints) }
      });

      logger.info({
        message: 'Loyalty points updated',
        context: {
          userId: user.id,
          customerId,
          action,
          points,
          newTotal: updated.points
        }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update loyalty points',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
