import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get payments list (paginated)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || '';
        const methodParam = searchParams.get('method') || '';
        const orderIdParam = searchParams.get('orderId') || '';

        const where: any = {
          organizationId: user.organizationId,
        };

        if (status) {
          where.status = status;
        }

        if (methodParam) {
          where.method = methodParam;
        }

        if (orderIdParam) {
          where.orderId = orderIdParam;
        }

        const [payments, total] = await Promise.all([
          prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
                  status: true,
                  total: true,
            customer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.payment.count({ where }),
        ]);

    return NextResponse.json({
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          },
        });

      case 'POST':
        // Process payment
        const { orderId: paymentOrderId, amount, method: paymentMethod, gateway, metadata } = await request.json();

        if (!paymentOrderId || !amount || !paymentMethod) {
      return NextResponse.json(
            { error: 'Missing required fields: orderId, amount, method' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to organization
    const order = await prisma.order.findFirst({
      where: {
            id: paymentOrderId,
            organizationId: user.organizationId,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
    });

    if (!order) {
      return NextResponse.json(
            { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findFirst({
      where: {
            orderId: paymentOrderId,
            status: {
              in: ['PENDING', 'COMPLETED'],
            },
          },
    });

    if (existingPayment) {
      return NextResponse.json(
            { error: 'Payment already exists for this order' },
        { status: 409 }
      );
    }

        // Create payment record
    const payment = await prisma.payment.create({
      data: {
            orderId: paymentOrderId,
            organizationId: user.organizationId,
            amount: parseFloat(amount),
            currency: 'LKR',
            method: paymentMethod,
            status: 'PENDING',
            gateway: gateway || 'STRIPE',
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });

        // Process payment based on method
    let paymentResult;
        switch (paymentMethod) {
          case 'CARD':
            paymentResult = await processCardPayment(payment, order);
          break;
        case 'CASH':
            paymentResult = await processCashPayment(payment, order);
          break;
        case 'BANK_TRANSFER':
            paymentResult = await processBankTransferPayment(payment, order);
          break;
        default:
            paymentResult = { success: false, error: 'Unsupported payment method' };
      }

      // Update payment status (CARD remains PENDING until client confirmation/webhook)
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentMethod === 'CARD' ? 'PENDING' : (paymentResult.success ? 'COMPLETED' : 'FAILED'),
          transactionId: paymentResult.transactionId || null,
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            processedAt: new Date().toISOString(),
            clientSecret: paymentResult.clientSecret,
            result: paymentResult,
          }),
        },
      });

        // Update order status if payment successful (non-card methods only)
        if (paymentMethod !== 'CARD' && paymentResult.success) {
      await prisma.order.update({
            where: { id: paymentOrderId },
            data: { status: 'PAID' },
          });
        }

        return NextResponse.json({
          message: paymentResult.success ? 'Payment processed successfully' : 'Payment failed',
          payment: {
            id: payment.id,
            amount: payment.amount,
            method: payment.method,
            status: paymentResult.success ? 'COMPLETED' : 'FAILED',
            transactionId: paymentResult.transactionId,
          },
          result: paymentResult,
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Payment processing functions
async function processCardPayment(payment: any, order: any) {
  // Create a Stripe Payment Intent and return client secret for client-side confirmation
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return {
        success: false,
        error: 'Stripe not configured',
      };
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    const currency = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd').toLowerCase();

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(payment.amount) * 100),
      currency,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        organizationId: order.organizationId || '',
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      success: true,
      transactionId: intent.id,
      clientSecret: intent.client_secret,
      gatewayResponse: {
        status: intent.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Payment gateway error',
    };
  }
}

async function processCashPayment(payment: any, order: any) {
  // Cash payments are always successful
    return { 
      success: true, 
    transactionId: `cash_${Date.now()}`,
    gatewayResponse: {
      status: 'completed',
      method: 'cash_on_delivery',
    },
  };
}

async function processBankTransferPayment(payment: any, order: any) {
  // Simulate bank transfer processing
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      transactionId: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gatewayResponse: {
        status: 'pending',
        reference: `REF-${Date.now()}`,
      },
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Bank transfer processing failed',
    };
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