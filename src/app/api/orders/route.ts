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

// Order creation schema
const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    price: z.number().positive('Price must be positive')
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional().default(0),
  shippingCost: z.number().min(0).optional().default(0)
});

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// GET /api/orders - List orders with pagination and filters
async function getOrders(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      organizationId: request.user!.organizationId
    };
    
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerId) where.customerId = customerId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where });
    
    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: true }
            }
          }
        }
      }
    });

    const responseData = {
      orders,
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
    console.error('Error fetching orders:', error);
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

// POST /api/orders - Create new order
async function createOrder(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return CommonErrors.BAD_REQUEST(
        'Validation failed',
        { errors: validationResult.error.errors },
        getRequestPath(request),
        generateRequestId()
      );
    }

    const orderData = validationResult.data;

    // Verify customer exists and belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: orderData.customerId,
        organizationId: request.user!.organizationId
      }
    });

    if (!customer) {
      return CommonErrors.NOT_FOUND(
        'Customer not found or access denied',
        getRequestPath(request),
        generateRequestId()
      );
    }

    // Verify all products exist and have sufficient stock
    const productIds = orderData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId: request.user!.organizationId,
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      return CommonErrors.NOT_FOUND(
        'One or more products not found',
        getRequestPath(request),
        generateRequestId()
      );
    }

    // Check stock availability
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      
      if (product.stockQuantity < item.quantity) {
        return CommonErrors.BAD_REQUEST(
          `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          getRequestPath(request),
          generateRequestId()
        );
      }
    }

    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (orderData.taxRate / 100);
    const total = subtotal + tax + orderData.shippingCost;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: {
            connect: { id: orderData.customerId }
          },
          organization: {
            connect: { id: request.user!.organizationId }
          },
          totalAmount: total,
          subtotal,
          tax,
          shipping: orderData.shippingCost,
          discount: 0, // Will be calculated if discount code is valid
          status: 'PENDING',
          paymentStatus: 'PENDING',
          // shippingMethod field removed - not in schema
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          createdBy: {
            connect: { id: request.user!.userId }
          },
          // Address fields removed - not in schema
        }
      });

      // Create order items
      const orderItems = await Promise.all(
        orderData.items.map(async (item) => {
          const product = products.find(p => p.id === item.productId)!;
          
          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } }
          });

          return tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            }
          });
        })
      );

      return { order, orderItems };
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ORDER_CREATED',
        description: `Order ${result.order.orderNumber} created`,
        userId: request.user!.userId,
        metadata: {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          customerId: result.order.customerId,
          totalAmount: result.order.totalAmount
        }
      }
    });

    return corsResponse({
      success: true,
      data: { 
        order: result.order,
        items: result.orderItems
      },
      message: 'Order created successfully'
    }, 201, getCorsOrigin(request));

  } catch (error) {
    console.error('Error creating order:', error);
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

// Export protected handlers with security middleware
export const GET = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  getOrders
);

export const POST = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  createOrder
); 