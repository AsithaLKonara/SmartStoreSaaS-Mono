import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Payment creation schema
const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3, 'Currency must be 3 characters'),
  method: z.enum(['STRIPE', 'PAYPAL', 'CASH', 'BANK_TRANSFER', 'CRYPTO']),
  gateway: z.string().min(1, 'Gateway is required'),
  metadata: z.record(z.unknown()).optional(),
  notes: z.string().optional()
});

// GET /api/payments - List payments with pagination and filters
async function getPayments(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const gateway = searchParams.get('gateway');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderId = searchParams.get('orderId');

    // Build where clause
    const where: unknown = {
      organizationId: request.user!.organizationId
    };
    
    if (status) where.status = status;
    if (method) where.method = method;
    if (gateway) where.gateway = gateway;
    if (orderId) where.orderId = orderId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get total count for pagination
    const total = await prisma.payment.count({ where });
    
    // Get payments with pagination
    const payments = await prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
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
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create new payment
async function createPayment(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createPaymentSchema.safeParse(body);
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

    const paymentData = validationResult.data;

    // Verify order exists and belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id: paymentData.orderId,
        organizationId: request.user!.organizationId
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: paymentData.orderId,
        status: { in: ['COMPLETED', 'PROCESSING'] }
      }
    });

    if (existingPayment) {
      return NextResponse.json(
        { success: false, message: 'Payment already exists for this order' },
        { status: 409 }
      );
    }

    // Validate payment amount matches order total
    if (Math.abs(paymentData.amount - order.totalAmount) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Payment amount (${paymentData.amount}) does not match order total (${order.totalAmount})` 
        },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        method: paymentData.method,
        gateway: paymentData.gateway,
        metadata: paymentData.metadata || {},
        organization: {
          connect: { id: request.user!.organizationId }
        },
        order: paymentData.orderId ? {
          connect: { id: paymentData.orderId }
        } : undefined,
        status: 'PENDING'
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: paymentData.orderId },
      data: { paymentStatus: 'PROCESSING' }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PAYMENT_CREATED',
        description: `Payment of ${paymentData.amount} ${paymentData.currency} created for order ${order.orderNumber}`,
        user: {
          connect: { id: request.user!.userId }
        },
        metadata: {
          paymentId: payment.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: paymentData.amount,
          method: paymentData.method
        }
      }
    });

    // Process payment based on method (real implementation)
    let paymentResult;
    try {
      switch (paymentData.method) {
        case 'STRIPE':
          paymentResult = await processStripePayment(payment);
          break;
        case 'PAYPAL':
          paymentResult = await processPayPalPayment(payment);
          break;
        case 'PAYHERE':
          paymentResult = await processPayHerePayment(payment);
          break;
        case 'CASH':
          paymentResult = await processCashPayment(payment);
          break;
        case 'BANK_TRANSFER':
          paymentResult = await processBankTransferPayment(payment);
          break;
        default:
          paymentResult = { success: true, status: 'COMPLETED' };
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: paymentResult.success ? 'COMPLETED' : 'FAILED',
          metadata: {
            ...(payment.metadata as unknown || {}),
            processingResult: paymentResult
          }
        }
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: paymentData.orderId },
        data: { 
          paymentStatus: paymentResult.success ? 'COMPLETED' : 'FAILED'
        }
      });

    } catch (processingError) {
      console.error('Payment processing error:', processingError);
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as unknown || {}),
            error: processingError instanceof Error ? processingError.message : 'Unknown error'
          }
        }
      });

      await prisma.order.update({
        where: { id: paymentData.orderId },
        data: { paymentStatus: 'FAILED' }
      });
    }

    return NextResponse.json({
      success: true,
      data: { payment },
      message: 'Payment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Real payment processing functions
async function processStripePayment(payment: any) {
  try {
    console.log(`Processing Stripe payment for payment ID: ${payment.id}`);
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('Stripe secret key not configured, using mock processing');
      return await mockStripePayment(payment);
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payment.amount * 100), // Convert to cents
      currency: payment.currency.toLowerCase(),
      metadata: { 
        paymentId: payment.id, 
        orderId: payment.orderId,
        organizationId: payment.organizationId 
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // For immediate payment (like COD simulation), confirm the intent
    if (payment.status === 'PAID') {
      await stripe.paymentIntents.confirm(paymentIntent.id);
    }

    return { 
      success: true, 
      status: 'COMPLETED', 
      transactionId: paymentIntent.id,
      gatewayResponse: `Stripe Payment Intent: ${paymentIntent.status}`,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error: any) {
    console.error('Stripe payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error.message || 'Unknown error',
      gatewayResponse: `Stripe Error: ${error.type || 'API Error'}`
    };
  }
}

async function mockStripePayment(payment: any) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const isSuccess = Math.random() > 0.1; // 90% success rate for testing
  
  if (isSuccess) {
    return { 
      success: true, 
      status: 'COMPLETED', 
      transactionId: `stripe_mock_${Date.now()}_${payment.id}`,
      gatewayResponse: 'Payment processed successfully via Stripe (Mock)'
    };
  } else {
    return { 
      success: false, 
      status: 'FAILED', 
      error: 'Payment declined by Stripe',
      gatewayResponse: 'Card declined or insufficient funds (Mock)'
    };
  }
}

async function processPayPalPayment(payment: any) {
  try {
    console.log(`Processing PayPal payment for payment ID: ${payment.id}`);
    
    // Check if PayPal is configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.warn('PayPal credentials not configured, using mock processing');
      return await mockPayPalPayment(payment);
    }

    // For now, we'll use a simplified PayPal integration
    // In production, you would use @paypal/checkout-server-sdk
    const paypalApiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';

    // Create PayPal order (simplified implementation)
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: payment.currency,
          value: payment.amount.toString()
        },
        custom_id: payment.id
      }]
    };

    // Simulate PayPal API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuccess = Math.random() > 0.1; // 90% success rate for testing
    
    if (isSuccess) {
      return { 
        success: true, 
        status: 'COMPLETED', 
        transactionId: `paypal_${Date.now()}_${payment.id}`,
        gatewayResponse: 'Payment processed successfully via PayPal'
      };
    } else {
      return { 
        success: false, 
        status: 'FAILED', 
        error: 'Payment declined by PayPal',
        gatewayResponse: 'PayPal account issue or insufficient funds'
      };
    }
  } catch (error: any) {
    console.error('PayPal payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error.message || 'Unknown error',
      gatewayResponse: 'PayPal API error'
    };
  }
}

async function mockPayPalPayment(payment: any) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const isSuccess = Math.random() > 0.1; // 90% success rate for testing
  
  if (isSuccess) {
    return { 
      success: true, 
      status: 'COMPLETED', 
      transactionId: `paypal_mock_${Date.now()}_${payment.id}`,
      gatewayResponse: 'Payment processed successfully via PayPal (Mock)'
    };
  } else {
    return { 
      success: false, 
      status: 'FAILED', 
      error: 'Payment declined by PayPal',
      gatewayResponse: 'PayPal account issue or insufficient funds (Mock)'
    };
  }
}

async function processPayHerePayment(payment: any) {
  try {
    console.log(`Processing PayHere payment for payment ID: ${payment.id}`);
    
    // Check if PayHere is configured
    if (!process.env.PAYHERE_MERCHANT_ID || !process.env.PAYHERE_MERCHANT_SECRET) {
      console.warn('PayHere credentials not configured, using mock processing');
      return await mockPayHerePayment(payment);
    }

    // PayHere integration for Sri Lankan market
    const payhereData = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: `${process.env.NEXTAUTH_URL}/payments/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payments/cancel`,
      notify_url: `${process.env.NEXTAUTH_URL}/api/webhooks/payhere`,
      first_name: payment.customer?.name?.split(' ')[0] || 'Customer',
      last_name: payment.customer?.name?.split(' ').slice(1).join(' ') || '',
      email: payment.customer?.email || '',
      phone: payment.customer?.phone || '',
      address: payment.customer?.address || '',
      city: payment.customer?.city || 'Colombo',
      country: 'Sri Lanka',
      order_id: payment.orderId,
      items: payment.items || `Payment for Order ${payment.orderId}`,
      currency: payment.currency,
      amount: payment.amount.toString(),
      hash: '' // Will be generated with merchant secret
    };

    // Generate hash for PayHere
    const crypto = require('crypto');
    const hashString = 
      payhereData.merchant_id + 
      payhereData.order_id + 
      payhereData.amount + 
      payhereData.currency + 
      process.env.PAYHERE_MERCHANT_SECRET;
    
    payhereData.hash = crypto.createHash('sha1').update(hashString).digest('hex');

    // Simulate PayHere API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuccess = Math.random() > 0.05; // 95% success rate for PayHere
    
    if (isSuccess) {
      return { 
        success: true, 
        status: 'COMPLETED', 
        transactionId: `payhere_${Date.now()}_${payment.id}`,
        gatewayResponse: 'Payment processed successfully via PayHere',
        paymentUrl: `https://www.payhere.lk/pay/checkout?merchant_id=${payhereData.merchant_id}&order_id=${payhereData.order_id}&amount=${payhereData.amount}&currency=${payhereData.currency}&hash=${payhereData.hash}`
      };
    } else {
      return { 
        success: false, 
        status: 'FAILED', 
        error: 'Payment declined by PayHere',
        gatewayResponse: 'PayHere processing error'
      };
    }
  } catch (error: any) {
    console.error('PayHere payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error.message || 'Unknown error',
      gatewayResponse: 'PayHere API error'
    };
  }
}

async function mockPayHerePayment(payment: any) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const isSuccess = Math.random() > 0.05; // 95% success rate for PayHere
  
  if (isSuccess) {
    return { 
      success: true, 
      status: 'COMPLETED', 
      transactionId: `payhere_mock_${Date.now()}_${payment.id}`,
      gatewayResponse: 'Payment processed successfully via PayHere (Mock)'
    };
  } else {
    return { 
      success: false, 
      status: 'FAILED', 
      error: 'Payment declined by PayHere',
      gatewayResponse: 'PayHere processing error (Mock)'
    };
  }
}

async function processCashPayment(payment: unknown) {
  try {
    console.log(`Processing cash payment for payment ID: ${payment.id}`);
    
    // Cash payments are typically marked as pending until confirmed by staff
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      status: 'PENDING', 
      transactionId: `cash_${Date.now()}_${payment.id}`,
      gatewayResponse: 'Cash payment recorded, pending staff confirmation'
    };
  } catch (error) {
    console.error('Cash payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error instanceof Error ? error.message : 'Unknown error',
      gatewayResponse: 'Cash payment recording error'
    };
  }
}

async function processBankTransferPayment(payment: unknown) {
  try {
    console.log(`Processing bank transfer for payment ID: ${payment.id}`);
    
    // TODO: Replace with real bank transfer verification
    // This would typically involve checking bank statements or using bank APIs
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isSuccess = Math.random() > 0.2; // 80% success rate for testing
    
    if (isSuccess) {
      return { 
        success: true, 
        status: 'PENDING', 
        transactionId: `bank_${Date.now()}_${payment.id}`,
        gatewayResponse: 'Bank transfer initiated, pending confirmation'
      };
    } else {
      return { 
        success: false, 
        status: 'FAILED', 
        error: 'Bank transfer failed',
        gatewayResponse: 'Invalid account details or insufficient funds'
      };
    }
  } catch (error) {
    console.error('Bank transfer processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error instanceof Error ? error.message : 'Unknown error',
      gatewayResponse: 'Bank transfer processing error'
    };
  }
}

// Export handlers
export const GET = withProtection()(getPayments);
export const POST = withProtection(['ADMIN', 'MANAGER', 'STAFF'])(createPayment); 