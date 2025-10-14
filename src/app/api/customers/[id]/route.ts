/**
 * Single Customer API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_CUSTOMERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const customerId = params.id;

      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      if (customer.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view customers from other organizations');
      }

      logger.info({
        message: 'Customer fetched',
        context: { userId: user.id, customerId }
      });

      return NextResponse.json(successResponse(customer));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const customerId = params.id;
      const body = await request.json();

      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      if (customer.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update customers from other organizations');
      }

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: body
      });

      logger.info({
        message: 'Customer updated',
        context: { userId: user.id, customerId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update customer',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const customerId = params.id;

      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      if (customer.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete customers from other organizations');
      }

      await prisma.customer.delete({
        where: { id: customerId }
      });

      logger.info({
        message: 'Customer deleted',
        context: { userId: user.id, customerId }
      });

      return NextResponse.json(successResponse({
        message: 'Customer deleted',
        customerId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete customer',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
