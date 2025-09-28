import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Customer update schema
const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
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
  isActive: z.boolean().optional()
});

// GET /api/customers/[id] - Get customer by ID
async function getCustomer(
  request: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: request.user!.organizationId
      },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                price: true,
                total: true,
                product: {
                  select: { id: true, name: true, sku: true, images: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate customer statistics
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderCount = customer.orders.length;
    const lastOrderDate = customer.orders.length > 0 ? customer.orders[0].createdAt : null;
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    const customerWithStats = {
      ...customer,
      statistics: {
        totalSpent,
        orderCount,
        lastOrderDate,
        averageOrderValue
      }
    };

    return NextResponse.json({
      success: true,
      data: { customer: customerWithStats }
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer (Admin/Manager/Staff only)
async function updateCustomer(
  request: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const body = await request.json();

    // Validate input
    const validationResult = updateCustomerSchema.safeParse(body);
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

    const updateData = validationResult.data;

    // Check if customer exists and belongs to user's organization
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: request.user!.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    // Check for email conflicts if updating email
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailConflict = await prisma.customer.findFirst({
        where: {
          email: updateData.email,
          organizationId: request.user!.organizationId,
          id: { not: customerId }
        }
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, message: 'Email already exists in this organization' },
          { status: 409 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CUSTOMER_UPDATED',
        description: `Customer "${updatedCustomer.name}" updated`,
        userId: request.user!.userId,
        metadata: {
          customerId: updatedCustomer.id,
          customerName: updatedCustomer.name,
          changes: Object.keys(updateData)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { customer: updatedCustomer },
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer (Admin only)
async function deleteCustomer(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    // Check if customer exists and belongs to user's organization
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: request.user!.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    // Check if customer has associated orders
    const orderCount = await prisma.order.count({
      where: { customerId }
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete customer with ${orderCount} existing orders. Consider deactivating instead.` 
        },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: customerId }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CUSTOMER_DELETED',
        description: `Customer "${existingCustomer.name}" deleted`,
        userId: request.user!.userId,
        metadata: {
          customerId: existingCustomer.id,
          customerName: existingCustomer.name,
          customerEmail: existingCustomer.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = createAuthHandler(
  async (request: AuthRequest) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop()!;
    return getCustomer(request, { params: { id } });
  },
  {
    requiredRole: ROLES.USER,
    requiredPermissions: [PERMISSIONS.CUSTOMERS_READ],
  }
);

export const PUT = createAuthHandler(
  async (request: AuthRequest) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop()!;
    return updateCustomer(request, { params: { id } });
  },
  {
    requiredRole: ROLES.USER,
    requiredPermissions: [PERMISSIONS.CUSTOMERS_WRITE],
  }
);

export const DELETE = createAuthHandler(
  async (request: AuthRequest) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop()!;
    return deleteCustomer(request, { params: { id } });
  },
  {
    requiredRole: ROLES.ADMIN,
    requiredPermissions: [PERMISSIONS.CUSTOMERS_DELETE],
  }
);
