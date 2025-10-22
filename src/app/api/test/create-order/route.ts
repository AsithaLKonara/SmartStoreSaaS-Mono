/**
 * Test API: Create Order
 * 
 * Only available in test/development environments
 * Quickly creates orders for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Guard: Only allow in test environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
  throw new Error('Test endpoints are disabled in production');
}

export async function POST(request: NextRequest) {
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
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        customerId,
        organizationId,
        status: status || 'PENDING',
        subtotal,
        tax,
        shipping,
        discount: discount || 0,
        total,
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

