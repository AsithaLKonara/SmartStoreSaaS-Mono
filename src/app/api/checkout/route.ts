import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// In-memory cart storage (same as cart API)
const carts = new Map<string, any>();

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;
    const cartId = user.id;

    switch (request.method) {
      case 'POST':
        // Process checkout
        const { 
          customerId: checkoutCustomerId, 
          shippingAddress, 
          billingAddress, 
          paymentMethod,
          notes 
        } = await request.json();

        // Get cart
        const cart = carts.get(cartId);
        if (!cart || cart.items.length === 0) {
          return NextResponse.json(
            { error: 'Cart is empty' },
            { status: 400 }
          );
        }

        // Validate required fields
        if (!checkoutCustomerId || !shippingAddress || !paymentMethod) {
          return NextResponse.json(
            { error: 'Missing required fields: customerId, shippingAddress, paymentMethod' },
            { status: 400 }
          );
        }

        // Verify customer exists and belongs to organization
        const checkoutCustomer = await prisma.customer.findFirst({
          where: {
            id: checkoutCustomerId,
            organizationId: user.organizationId,
          },
        });

        if (!checkoutCustomer) {
          return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
          );
        }

        // Verify all products are still available and calculate totals
        let orderTotal = 0;
        const orderItems = [];

        for (const cartItem of cart.items) {
          const product = await prisma.product.findFirst({
            where: {
              id: cartItem.productId,
              organizationId: user.organizationId,
              isActive: true,
            },
          });

          if (!product) {
            return NextResponse.json(
              { error: `Product ${cartItem.productId} not found or inactive` },
              { status: 400 }
            );
          }

          // Check stock
          const availableStock = cartItem.variantId 
            ? (await prisma.productVariant.findUnique({
                where: { id: cartItem.variantId },
              }))?.stock || 0
            : product.stock;

          if (availableStock < cartItem.quantity) {
            return NextResponse.json(
              { error: `Insufficient stock for product ${product.name}` },
              { status: 400 }
            );
          }

          const itemTotal = cartItem.price * cartItem.quantity;
          orderTotal += itemTotal;

          orderItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            quantity: cartItem.quantity,
            price: cartItem.price,
            total: itemTotal,
          });
        }

        // Create order
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerId: checkoutCustomerId,
            organizationId: user.organizationId,
            status: 'PENDING',
            total: orderTotal,
            subtotal: orderTotal * 0.9, // Assuming 10% tax
            tax: orderTotal * 0.1,
            shipping: 0, // Free shipping for now
            discount: 0,
            notes: notes || null,
          },
        });

        // Create order items
        for (const item of orderItems) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            },
          });
        }

        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            orderId: order.id,
            organizationId: user.organizationId,
            amount: orderTotal,
            currency: 'LKR',
            method: paymentMethod,
            status: 'PENDING',
            gateway: paymentMethod === 'CARD' ? 'STRIPE' : 'CASH',
            metadata: JSON.stringify({
              customerId: checkoutCustomerId,
              shippingAddress,
              billingAddress,
              processedAt: new Date().toISOString(),
            }),
          },
        });

        // Update inventory
        for (const item of orderItems) {
          if (item.variantId) {
            // Update variant stock
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          } else {
            // Update product stock
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          // Record inventory movement
          await prisma.inventoryMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              type: 'OUT',
              quantity: item.quantity,
              reason: 'Order checkout',
              reference: orderNumber,
            },
          });
        }

        // Clear cart
        carts.delete(cartId);

        // Return order details
        const orderWithDetails = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        });

        return NextResponse.json(
          {
            message: 'Order created successfully',
            order: orderWithDetails,
            payment: {
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              status: payment.status,
            },
          },
          { status: 201 }
        );

      case 'GET':
        // Get checkout summary (cart + customer info)
        const cartSummary = carts.get(cartId) || { items: [], total: 0, itemCount: 0 };
        
        // Get customer details if provided
        const { searchParams } = new URL(request.url);
        const customerIdParam = searchParams.get('customerId');
        
        let customerInfo = null;
        if (customerIdParam) {
          customerInfo = await prisma.customer.findFirst({
            where: {
              id: customerIdParam,
              organizationId: user.organizationId,
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          });
        }

        return NextResponse.json({
          cart: cartSummary,
          customer: customerInfo,
          summary: {
            subtotal: cartSummary.total,
            tax: cartSummary.total * 0.1,
            shipping: 0,
            total: cartSummary.total * 1.1,
            itemCount: cartSummary.itemCount,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ORDERS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ORDERS_WRITE],
});
