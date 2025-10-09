import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { addTenantFilter, ensureTenantOwnership } from '@/lib/tenant/isolation';

export const dynamic = 'force-dynamic';
// Helper function to fetch customers
async function getCustomers(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Fetch customers using connection pool (tenant-isolated)
  const tenantWhere = await addTenantFilter(where);
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: tenantWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.count({ where: tenantWhere })
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: customers,
    pagination: {
      page,
      limit,
      total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    message: 'Customers fetched successfully'
  });
}

// GET /api/customers - Fetch all customers with pagination and filtering
export const GET = withErrorHandling(getCustomers);

// POST /api/customers - Create a new customer
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { name, email, phone, address } = body;

  if (!name || !email) {
    return NextResponse.json({
      success: false,
      message: 'Missing required fields: name and email are required'
    }, { status: 400 });
  }

  // Create customer using connection pool (tenant-isolated)
  const customerData = await ensureTenantOwnership({
    id: `customer-${Date.now()}`,
    name,
    email,
    phone,
    address
  });
  
  const customer = await prisma.customer.create({
    data: customerData
  });

  return NextResponse.json({
    success: true,
    data: customer,
    message: 'Customer created successfully'
  }, { status: 201 });
});

// PUT /api/customers - Update an existing customer
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Customer ID is required'
    }, { status: 400 });
  }

  // Update customer using connection pool
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    data: customer,
    message: 'Customer updated successfully'
  });
});

// DELETE /api/customers - Delete a customer
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Customer ID is required'
    }, { status: 400 });
  }

  // Delete customer using connection pool
  await prisma.customer.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true,
    message: 'Customer deleted successfully'
  });
});
