/**
 * Test API: Create Order
 * 
 * Only available in test/development environments
 * Quickly creates orders for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Guard: Only allow in test environment
// Environment check moved inside handler to prevent build-time errors

export async function POST(request: NextRequest) {
  // Guard: Only allow in test environment
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();

    const {
      organizationId,
      customerId,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      status,
    } = data;

    if (!organizationId || !customerId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calculatedSubtotal = subtotal !== undefined ? subtotal : items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    const calculatedTax = tax !== undefined ? tax : 0;
    const calculatedShipping = shipping !== undefined ? shipping : 0;
    const calculatedDiscount = discount !== undefined ? discount : 0;
    const calculatedTotal = total !== undefined ? total : (calculatedSubtotal + calculatedShipping + calculatedTax - calculatedDiscount);

    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        customerId,
        organizationId,
        status: status || 'PENDING',
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        shipping: calculatedShipping,
        discount: calculatedDiscount,
        total: calculatedTotal,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          })),
        },
      },
      include: {
        orderItems: true,
        customer: true,
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

