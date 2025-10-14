/**
 * Customers API Route
 * 
 * Handles customer management operations
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_CUSTOMERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_CUSTOMERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_CUSTOMERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * 
 * Organization Scoping:
 * - All users see only their organization's customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * List customers with organization scoping
 */
export const GET = requirePermission('VIEW_CUSTOMERS')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const skip = (page - 1) * limit;

      // Organization scoping (CRITICAL)
      const orgId = getOrganizationScope(user);
      
      // Build where clause
      const where: any = {};
      
      // Add organization filter
      if (orgId) {
        where.organizationId = orgId;
      }
      
      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.customer.count({ where })
      ]);

      logger.info({
        message: 'Customers fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
          count: customers.length,
          page,
          limit
        }
      });

      return NextResponse.json(
        successResponse(customers, {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customers',
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

/**
 * POST /api/customers
 * Create new customer
 */
export const POST = requirePermission('MANAGE_CUSTOMERS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, email, phone, address } = body;

      // Validation
      if (!name || !email) {
        throw new ValidationError('Name and email are required', {
          fields: { name: !name, email: !email }
        });
      }

      // Organization scoping (CRITICAL)
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Check for duplicate email within organization
      const existing = await prisma.customer.findFirst({
        where: {
          email,
          organizationId
        }
      });

      if (existing) {
        throw new ValidationError('Customer with this email already exists', {
          field: 'email',
          value: email
        });
      }

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          address,
          organizationId // CRITICAL: ensure customer belongs to user's org
        }
      });

      logger.info({
        message: 'Customer created',
        context: {
          createdBy: user.id,
          customerId: customer.id,
          email: customer.email,
          organizationId: customer.organizationId
        }
      });

      return NextResponse.json(
        successResponse(customer),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create customer',
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

/**
 * PUT /api/customers
 * Update existing customer
 */
export const PUT = requirePermission('MANAGE_CUSTOMERS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      // Validation
      if (!id) {
        throw new ValidationError('Customer ID is required');
      }

      // Verify customer belongs to user's organization
      const existing = await prisma.customer.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new ValidationError('Customer not found');
      }

      if (existing.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update customers from other organizations');
      }

      // Update customer
      const customer = await prisma.customer.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Customer updated',
        context: {
          updatedBy: user.id,
          customerId: customer.id,
          organizationId: customer.organizationId
        }
      });

      return NextResponse.json(
        successResponse(customer)
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to update customer',
        error: error,
        context: {
          userId: user.id,
          customerId: body?.id
        }
      });
      throw error;
    }
  }
);

/**
 * DELETE /api/customers
 * Delete customer (soft delete recommended in production)
 */
export const DELETE = requirePermission('MANAGE_CUSTOMERS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { id } = body;

      // Validation
      if (!id) {
        throw new ValidationError('Customer ID is required');
      }

      // Verify customer belongs to user's organization
      const existing = await prisma.customer.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new ValidationError('Customer not found');
      }

      if (existing.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete customers from other organizations');
      }

      // Delete customer
      await prisma.customer.delete({
        where: { id }
      });

      logger.info({
        message: 'Customer deleted',
        context: {
          deletedBy: user.id,
          customerId: id,
          organizationId: existing.organizationId
        }
      });

      return NextResponse.json(
        successResponse({ message: 'Customer deleted successfully' })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete customer',
        error: error,
        context: {
          userId: user.id,
          customerId: body?.id
        }
      });
      throw error;
    }
  }
);
