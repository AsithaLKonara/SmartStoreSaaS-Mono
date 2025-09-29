import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create-order':
        return await createOrder(data, request.user!.id);
      
      case 'capture-order':
        return await captureOrder(data, request.user!.id);
      
      case 'get-order':
        return await getOrder(data, request.user!.id);
      
      case 'create-refund':
        return await createRefund(data, request.user!.id);
      
      case 'create-billing-plan':
        return await createBillingPlan(data, request.user!.id);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('PayPal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createOrder(data: unknown, userId: string) {
  const { amount, currency, orderId, returnUrl, cancelUrl } = data;
  
  // Verify user owns this order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      organizationId: userId, // Assuming organization ownership
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const paypalOrder = await paypalService.createOrder(
    amount,
    currency,
    orderId,
    returnUrl,
    cancelUrl
  );

  return NextResponse.json(paypalOrder);
}

async function captureOrder(data: unknown, userId: string) {
  const { paypalOrderId } = data;
  
  // Verify user owns this order
  const order = await prisma.order.findFirst({
    where: {
      paypalOrderId,
      organizationId: userId,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const payment = await paypalService.captureOrder(paypalOrderId);
  return NextResponse.json(payment);
}

async function getOrder(data: unknown, userId: string) {
  const { paypalOrderId } = data;
  
  // Verify user owns this order
  const order = await prisma.order.findFirst({
    where: {
      paypalOrderId,
      organizationId: userId,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const paypalOrder = await paypalService.getOrder(paypalOrderId);
  return NextResponse.json(paypalOrder);
}

async function createRefund(data: unknown, userId: string) {
  const { paymentId, amount, currency, note } = data;
  
  // Verify user owns this payment
  const order = await prisma.order.findFirst({
    where: {
      paypalPaymentId: paymentId,
      organizationId: userId,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const refund = await paypalService.createRefund(paymentId, amount, currency, note);
  return NextResponse.json(refund);
}

async function createBillingPlan(data: unknown, userId: string) {
  const { name, description, amount, currency, interval } = data;
  
  const plan = await paypalService.createBillingPlan(
    name,
    description,
    amount,
    currency,
    interval
  );

  return NextResponse.json(plan);
}

// Webhook endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    await paypalService.handleWebhook(headers, body);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});
