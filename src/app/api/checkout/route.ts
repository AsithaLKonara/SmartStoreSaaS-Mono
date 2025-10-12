/**
 * Checkout API
 * Handles the checkout process from cart to order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { stripeService } from '@/lib/payments/stripeService';
import { initiatePayHerePayment } from '@/lib/integrations/payhere';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  paymentMethod: 'stripe' | 'payhere' | 'cash';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerNotes?: string;
}

/**
 * POST /api/checkout - Process checkout
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = token.sub as string;
    const body: CheckoutRequest = await request.json();

    // Validate required fields
    if (!body.paymentMethod || !body.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Payment method and shipping address are required' },
        { status: 400 }
      );
    }

    // Get cart (draft order)
    const cart = await prisma.order.findFirst({
      where: {
        customerId: userId,
        status: 'DRAFT',
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    if (!cart || cart.orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Verify stock availability
    for (const item of cart.orderItems) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
          },
          { status: 400 }
        );
      }
    }

    // Create order from cart
    const orderNumber = `ORD-${Date.now()}`;
    
    // Convert cart to order
    const order = await prisma.order.update({
      where: { id: cart.id },
      data: {
        status: 'PENDING',
        orderNumber,
        notes: body.customerNotes,
        // Store addresses as JSON strings
        // In production, you'd have separate Address models
      },
    });

    // Reduce stock for ordered items
    for (const item of cart.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      // Create inventory movement record
      await prisma.inventoryMovement.create({
        data: {
          id: `inv-mov-${Date.now()}-${item.productId}`,
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          notes: `Order ${orderNumber}`,
        }
      });
    }

    // Process payment based on method
    let paymentResult: any = null;

    if (body.paymentMethod === 'stripe') {
      // Create Stripe payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        Number(cart.total),
        'lkr', // Sri Lankan Rupees
        userId,
        {
          orderId: order.id,
          orderNumber,
        }
      );

      paymentResult = {
        method: 'stripe',
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.id,
      };

      // Create payment record
      await prisma.payment.create({
        data: {
          id: `payment-${Date.now()}`,
          orderId: order.id,
          organizationId: order.organizationId,
          amount: cart.total,
          currency: 'LKR',
          method: 'STRIPE',
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
        },
      });

    } else if (body.paymentMethod === 'payhere') {
      // Initiate PayHere payment
      const payHereData = await initiatePayHerePayment({
        orderId: order.id,
        amount: Number(cart.total),
        currency: 'LKR',
        firstName: cart.customer.name.split(' ')[0],
        lastName: cart.customer.name.split(' ').slice(1).join(' ') || 'Customer',
        email: cart.customer.email,
        phone: cart.customer.phone || '',
        address: body.shippingAddress.street,
        city: body.shippingAddress.city,
        country: body.shippingAddress.country || 'LK',
        returnUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/checkout`,
        notifyUrl: `${process.env.NEXTAUTH_URL}/api/payments/payhere/notify`,
        items: cart.orderItems.map(item => item.product.name).join(', '),
      });

      paymentResult = {
        method: 'payhere',
        paymentUrl: payHereData.paymentUrl,
        hash: payHereData.hash,
      };

      // Create payment record
      await prisma.payment.create({
        data: {
          id: `payment-${Date.now()}`,
          orderId: order.id,
          organizationId: order.organizationId,
          amount: cart.total,
          currency: 'LKR',
          method: 'PAYHERE',
          status: 'PENDING',
        },
      });

    } else if (body.paymentMethod === 'cash') {
      // Cash on delivery
      await prisma.payment.create({
        data: {
          id: `payment-${Date.now()}`,
          orderId: order.id,
          organizationId: order.organizationId,
          amount: cart.total,
          currency: 'LKR',
          method: 'CASH',
          status: 'PENDING',
        },
      });

      // Update order status to confirmed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

      paymentResult = {
        method: 'cash',
        message: 'Cash on delivery order confirmed',
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber,
        total: Number(cart.total),
        payment: paymentResult,
      },
      message: 'Checkout successful',
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout - Get checkout summary
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = token.sub as string;

    // Get cart
    const cart = await prisma.order.findFirst({
      where: {
        customerId: userId,
        status: 'DRAFT',
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    if (!cart || cart.orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: cart.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: Number(item.price),
          quantity: item.quantity,
          total: Number(item.total),
        })),
        summary: {
          subtotal: Number(cart.subtotal),
          shipping: Number(cart.shipping),
          tax: Number(cart.tax),
          total: Number(cart.total),
        },
        customer: {
          name: cart.customer.name,
          email: cart.customer.email,
          phone: cart.customer.phone,
        }
      }
    });
  } catch (error: any) {
    console.error('Get checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch checkout' },
      { status: 500 }
    );
  }
}

