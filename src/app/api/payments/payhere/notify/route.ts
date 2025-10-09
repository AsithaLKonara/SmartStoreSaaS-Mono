import { NextRequest, NextResponse } from 'next/server';
import { verifyPayHereCallback } from '@/lib/integrations/payhere';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    
    // Convert FormData to object
    const data: any = {};
    body.forEach((value, key) => {
      data[key] = value;
    });

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
      method,
    } = data;

    // Verify callback
    const isValid = await verifyPayHereCallback(data);

    if (!isValid) {
      console.error('Invalid PayHere callback');
      return NextResponse.json(
        { error: 'Invalid callback' },
        { status: 400 }
      );
    }

    // Payment successful
    if (status_code === '2') {
      // Update order
      await prisma.order.update({
        where: { orderNumber: order_id },
        data: { status: 'PROCESSING' },
      });

      // Find order to get organizationId
      const order = await prisma.order.findUnique({
        where: { orderNumber: order_id },
        select: { id: true, organizationId: true },
      });

      if (order) {
        // Create payment record
        await prisma.payment.create({
          data: {
            orderId: order.id,
            organizationId: order.organizationId,
            amount: parseFloat(payhere_amount),
            currency: payhere_currency,
            method: 'CARD',
            status: 'COMPLETED',
            transactionId: payment_id,
            gateway: 'PayHere',
            metadata: JSON.stringify({
              paymentId: payment_id,
              method,
              statusCode: status_code,
            }),
          },
        });

        console.log(`PayHere payment successful for order ${order_id}`);
      }
    } else {
      // Payment failed
      const order = await prisma.order.findUnique({
        where: { orderNumber: order_id },
      });

      if (order) {
        await prisma.order.update({
          where: { orderNumber: order_id },
          data: { status: 'PAYMENT_FAILED' },
        });

        await prisma.payment.create({
          data: {
            orderId: order.id,
            organizationId: order.organizationId,
            amount: parseFloat(payhere_amount),
            currency: payhere_currency,
            method: 'CARD',
            status: 'FAILED',
            transactionId: payment_id || `payhere_${Date.now()}`,
            gateway: 'PayHere',
            metadata: JSON.stringify({
              statusCode: status_code,
              error: 'Payment failed',
            }),
          },
        });

        console.log(`PayHere payment failed for order ${order_id}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PayHere notify error:', error);
    return NextResponse.json(
      { error: error.message || 'Callback processing failed' },
      { status: 500 }
    );
  }
}

