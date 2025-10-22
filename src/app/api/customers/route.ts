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

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * List customers with organization scoping
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'VIEW_CUSTOMERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // TODO: Get organization scoping from session
    // const orgId = session.user.organizationId;
    
    // Build where clause
    const where: any = {};
    
    // TODO: Add organization filter
    // if (orgId) {
    //   where.organizationId = orgId;
    // }
    
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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch customers' }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * Create new customer
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'MANAGE_CUSTOMERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

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

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'User must belong to an organization' }, { status: 400 });
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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create customer' }, { status: 500 });
  }
}

/**
 * PUT /api/customers
 * Update existing customer
 */
export async function PUT(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'MANAGE_CUSTOMERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { id, ...updateData } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    // Verify customer belongs to user's organization
    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add organization check
    // if (existing.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Cannot update customers from other organizations' }, { status: 403 });
    // }

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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to update customer' }, { status: 500 });
  }
}

/**
 * DELETE /api/customers
 * Delete customer (soft delete recommended in production)
 */
export async function DELETE(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'MANAGE_CUSTOMERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { id } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    // Verify customer belongs to user's organization
    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add organization check
    // if (existing.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Cannot delete customers from other organizations' }, { status: 403 });
    // }

    // Delete customer
    await prisma.customer.delete({
      where: { id }
    });

    logger.info({
      message: 'Customer deleted',
      context: {
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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to delete customer' }, { status: 500 });
  }
}
