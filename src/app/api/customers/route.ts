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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * List customers with organization scoping
 */
export const GET = requirePermission('VIEW_CUSTOMERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Get organization scoping
    const orgId = getOrganizationScope(user);
    
    // Build where clause
    const where: any = {};
    
    // Add organization filter (CRITICAL: prevents cross-tenant data leaks)
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
        count: customers.length,
        page,
        limit,
        organizationId: orgId
      },
      correlation: req.correlationId
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
        message: 'Failed to fetch customers',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customers
 * Create new customer
 */
export const POST = requirePermission('MANAGE_CUSTOMERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
    const { name, email, phone, address } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and email are required',
        fields: { name: !name, email: !email }
      }, { status: 400 });
    }

    // Get organizationId from user
    const organizationId = getOrganizationScope(user);
    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User must belong to an organization' 
      }, { status: 400 });
    }

    // Check for duplicate email within organization
    const existing = await prisma.customer.findFirst({
      where: {
        email,
        organizationId
      }
    });

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer with this email already exists',
        field: 'email',
        value: email
      }, { status: 400 });
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        organizationId
      }
    });

    logger.info({
      message: 'Customer created',
      context: {
        customerId: customer.id,
        email: customer.email,
        organizationId: customer.organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });

      return NextResponse.json(
        successResponse(customer),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create customer',
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
        message: 'Failed to create customer',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

/**
 * PUT /api/customers
 * Update existing customer
 */
export const PUT = requirePermission('MANAGE_CUSTOMERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
    const { id, ...updateData } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer ID is required' 
      }, { status: 400 });
    }

    // Verify customer belongs to user's organization
    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer not found' 
      }, { status: 404 });
    }

    // Organization check - SUPER_ADMIN can update any customer
    const orgId = getOrganizationScope(user);
    if (existing.organizationId !== orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot update customers from other organizations' 
      }, { status: 403 });
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
        customerId: customer.id,
        organizationId: customer.organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });

      return NextResponse.json(successResponse(customer));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update customer',
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
        message: 'Failed to update customer',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/customers
 * Delete customer (soft delete recommended in production)
 */
export const DELETE = requirePermission('MANAGE_CUSTOMERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
    const { id } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer ID is required' 
      }, { status: 400 });
    }

    // Verify customer belongs to user's organization
    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Customer not found' 
      }, { status: 404 });
    }

    // Organization check - SUPER_ADMIN can delete any customer
    const orgId = getOrganizationScope(user);
    if (existing.organizationId !== orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete customers from other organizations' 
      }, { status: 403 });
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id }
    });

    logger.info({
      message: 'Customer deleted',
      context: {
        customerId: id,
        organizationId: existing.organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });

      return NextResponse.json(
        successResponse({ message: 'Customer deleted successfully' })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete customer',
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
        message: 'Failed to delete customer',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);
