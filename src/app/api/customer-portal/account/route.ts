/**
 * Customer Portal Account API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only
 * - PUT: CUSTOMER only (can update own account)
 * 
 * Customer Scoping:
 * - Returns/updates only the authenticated customer's data
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
      // CRITICAL: Find customer record for this user only
      const customer = await prisma.customer.findFirst({
        where: { 
          email: user.email,
          organizationId: user.organizationId // CRITICAL: org scoping
        }
      });

      if (!customer) {
        throw new ValidationError('Customer record not found');
      }

      // Fetch loyalty information if exists
      const loyalty = await prisma.customerLoyalty.findUnique({
        where: { customerId: customer.id }
      });

      const accountData = {
        ...customer,
        loyalty: loyalty ? {
          points: loyalty.points,
          tier: loyalty.tier,
          totalSpent: Number(loyalty.totalSpent)
        } : null
      };

      logger.info({
        message: 'Customer account fetched',
        context: {
          userId: user.id,
          customerId: customer.id
        }
      });

      return NextResponse.json(
        successResponse(accountData)
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, phone, address } = body;

      // CRITICAL: Find customer record for this user
      const customer = await prisma.customer.findFirst({
        where: {
          email: user.email,
          organizationId: user.organizationId
        }
      });

      if (!customer) {
        throw new ValidationError('Customer record not found');
      }

      // Update only allowed fields
      const updated = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(address && { address })
        }
      });

      logger.info({
        message: 'Customer account updated',
        context: {
          userId: user.id,
          customerId: customer.id
        }
      });

      return NextResponse.json(
        successResponse(updated)
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to update customer account',
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
        message: 'Use PUT to update account',
        status: 'use_put_method'
      })
    );
  }
);
