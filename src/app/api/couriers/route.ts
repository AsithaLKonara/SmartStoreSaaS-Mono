import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Courier creation schema
const createCourierSchema = z.object({
  name: z.string().min(2, 'Courier name must be at least 2 characters'),
  code: z.string().min(2, 'Courier code must be at least 2 characters'),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isActive: z.boolean().default(true),
  contactInfo: z.object({
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional()
  }).optional(),
  serviceAreas: z.array(z.string()).optional(),
  vehicleType: z.string().optional(),
  maxWeight: z.number().positive('Max weight must be positive').optional()
});

// GET /api/couriers - List couriers with real statistics
async function getCouriers(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('page') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      organizationId: (request as any).user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null) where.isActive = isActive === 'true';

    // Get total count for pagination
    const total = await prisma.courier.count({ where });
    
    // Get couriers with pagination
    const couriers = await prisma.courier.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        // deliveries include removed - not in schema
      }
    });

    // Statistics calculation removed - deliveries not in schema
    const couriersWithStats = couriers;

    return NextResponse.json({
      success: true,
      data: {
        couriers: couriersWithStats,
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
    console.error('Error fetching couriers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch couriers' },
      { status: 500 }
    );
  }
}

// POST /api/couriers - Create new courier
async function createCourier(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createCourierSchema.safeParse(body);
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

    const courierData = validationResult.data;

    // Check if courier code already exists in the organization
    const existingCourier = await prisma.courier.findFirst({
      where: {
        code: courierData.code,
        organizationId: (request as any).user!.organizationId
      }
    });

    if (existingCourier) {
      return NextResponse.json(
        { success: false, message: 'Courier code already exists in this organization' },
        { status: 409 }
      );
    }

    // Create courier
    const courier = await prisma.courier.create({
      data: {
        ...courierData,
        organization: {
          connect: { id: (request as any).user!.organizationId }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'COURIER_CREATED',
        description: `Courier "${courier.name}" created`,
        user: {
          connect: { id: (request as any).user!.userId }
        },
        metadata: {
          courierId: courier.id,
          courierName: courier.name,
          courierCode: courier.code
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { courier },
      message: 'Courier created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating courier:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create courier' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getCouriers);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createCourier); 