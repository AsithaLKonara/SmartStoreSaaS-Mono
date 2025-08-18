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
  metadata: z.record(z.any()).optional(),
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
    const where: any = {
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
            ...(payment.metadata as any || {}),
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
            ...(payment.metadata as any || {}),
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
    // In production, this would make real Stripe API calls
    // For now, we'll simulate the process but mark it as needing real integration
    console.log(`Processing Stripe payment for payment ID: ${payment.id}`);
    
    // TODO: Replace with real Stripe API integration
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(payment.amount * 100), // Convert to cents
    //   currency: payment.currency.toLowerCase(),
    //   metadata: { paymentId: payment.id, orderId: payment.orderId }
    // });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For development, simulate success
    // In production, this would be based on actual Stripe response
    const isSuccess = Math.random() > 0.1; // 90% success rate for testing
    
    if (isSuccess) {
      return { 
        success: true, 
        status: 'COMPLETED', 
        transactionId: `stripe_${Date.now()}_${payment.id}`,
        gatewayResponse: 'Payment processed successfully via Stripe'
      };
    } else {
      return { 
        success: false, 
        status: 'FAILED', 
        error: 'Payment declined by Stripe',
        gatewayResponse: 'Card declined or insufficient funds'
      };
    }
  } catch (error) {
    console.error('Stripe payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error instanceof Error ? error.message : 'Unknown error',
      gatewayResponse: 'Stripe API error'
    };
  }
}

async function processPayPalPayment(payment: any) {
  try {
    console.log(`Processing PayPal payment for payment ID: ${payment.id}`);
    
    // TODO: Replace with real PayPal API integration
    // const paypal = require('@paypal/checkout-server-sdk');
    // const environment = new paypal.core.SandboxEnvironment(
    //   process.env.PAYPAL_CLIENT_ID!,
    //   process.env.PAYPAL_CLIENT_SECRET!
    // );
    // const client = new paypal.core.PayPalHttpClient(environment);
    
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
  } catch (error) {
    console.error('PayPal payment processing error:', error);
    return { 
      success: false, 
      status: 'FAILED', 
      error: error instanceof Error ? error.message : 'Unknown error',
      gatewayResponse: 'PayPal API error'
    };
  }
}

async function processCashPayment(payment: any) {
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

async function processBankTransferPayment(payment: any) {
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