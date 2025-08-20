import { AuthenticatedRequest, withProtection } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { 
  CommonErrors,
  generateRequestId,
  getRequestPath
} from '@/lib/error-handling';

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

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// GET /api/customers - List customers with pagination and filters
async function getCustomers(request: AuthenticatedRequest) {
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

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(responseData, 200, origin);

  } catch (error) {
    console.error('Error fetching customers:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database query error',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// POST /api/customers - Create new customer
async function createCustomer(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.VALIDATION_ERROR(
        validationResult.error.errors,
        path,
        requestId
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
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.CONFLICT(
        'Customer with this email already exists in this organization',
        path,
        requestId
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        organization: {
          connect: { id: request.user!.organizationId }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CUSTOMER_CREATED',
        description: `Customer "${customer.name}" created`,
        userId: request.user!.userId,
        metadata: {
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email
        }
      }
    });

    const responseData = { customer };

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(responseData, 201, origin);

  } catch (error) {
    console.error('Error creating customer:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database operation failed',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// Export protected handlers with security middleware
export const GET = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  getCustomers
);

export const POST = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  createCustomer
); 