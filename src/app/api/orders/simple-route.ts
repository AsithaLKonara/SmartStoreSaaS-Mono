// Simplified Orders API - Working Version
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.order.count()
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      orders, // For compatibility
      pagination: { page, limit, total },
      message: 'Orders fetched successfully'
    });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, items, ...orderData } = body;
    
    const order = await prisma.order.create({
      data: {
        ...orderData,
        id: `order-${Date.now()}`,
        orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
        customerId,
        organizationId: 'seed-org-1-1759434570099',
        total: orderData.totalAmount || 0,
        subtotal: orderData.totalAmount || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

