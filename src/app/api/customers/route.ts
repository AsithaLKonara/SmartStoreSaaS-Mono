import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Customer creation schema
const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

// GET /api/customers - List customers with pagination and filters
async function getCustomers(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const source = searchParams.get('source');
    const tags = searchParams.get('tags');

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      organizationId: request.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null) where.isActive = isActive === 'true';
    if (source) where.source = source;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Get total count for pagination
    const total = await prisma.customer.count({ where });
    
    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Limit to recent 5 orders
        }
      }
    });

    const responseData = {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
async function createCustomer(request: AuthRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const customerData = validationResult.data;

    // Check if email already exists in the organization
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: customerData.email,
        organizationId: request.user!.organizationId
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists in this organization' },
        { status: 409 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        organizationId: request.user!.organizationId
      }
    });

    return NextResponse.json({ customer }, { status: 201 });

  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export protected handlers with security middleware
export const GET = createAuthHandler(getCustomers, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.CUSTOMERS_READ],
});

export const POST = createAuthHandler(createCustomer, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.CUSTOMERS_WRITE],
}); 