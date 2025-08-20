import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Warehouse creation schema
const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name must be at least 2 characters'),
  code: z.string().min(2, 'Warehouse code must be at least 2 characters'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactEmail: z.string().email('Invalid email format'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  isActive: z.boolean().optional().default(true),
  capacity: z.number().positive('Capacity must be positive').optional(),
  notes: z.string().optional()
});

// GET /api/warehouses - List warehouses with pagination and filters
async function getWarehouses(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const city = searchParams.get('city');

    // Build where clause
    const where: unknown = {
      organizationId: request.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null) where.isActive = isActive === 'true';
    if (city) where.address = { city: { contains: city, mode: 'insensitive' } };

    // Get total count for pagination
    const total = await prisma.warehouse.count({ where });
    
    // Get warehouses with pagination
    const warehouses = await prisma.warehouse.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      // include removed - no relations in schema
    });

    // Statistics calculation removed - inventory not in schema
    const warehousesWithStats = warehouses;

    return NextResponse.json({
      success: true,
      data: {
        warehouses: warehousesWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Create new warehouse
async function createWarehouse(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createWarehouseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const warehouseData = validationResult.data;

    // Check if warehouse code already exists in the organization
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: {
        // code field removed - not in schema
        organizationId: request.user!.organizationId
      }
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { success: false, message: 'Warehouse code already exists in this organization' },
        { status: 409 }
      );
    }

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        ...warehouseData,
        organization: {
          connect: { id: request.user!.organizationId }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'WAREHOUSE_CREATED',
        description: `Warehouse "${warehouse.name}" created`,
        user: {
          connect: { id: request.user!.userId }
        },
        metadata: {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { warehouse },
      message: 'Warehouse created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getWarehouses);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createWarehouse); 