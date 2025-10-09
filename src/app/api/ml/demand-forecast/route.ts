import { NextRequest, NextResponse } from 'next/server';
import { mlService } from '@/lib/ml/predictions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const organizationId = searchParams.get('organizationId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get historical order data for the product
    const historicalOrders = await prisma.orderItem.findMany({
      where: {
        productId,
        ...(organizationId && { order: { organizationId } }),
      },
      select: {
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 90, // Last 90 days
    });

    // Generate forecast
    const forecast = await mlService.predictDemand(productId, historicalOrders);

    // Get product name
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    forecast.productName = product?.name || 'Unknown Product';

    return NextResponse.json({
      success: true,
      forecast,
      note: 'This is a placeholder implementation. Integrate real ML model for production.',
    });
  } catch (error: any) {
    console.error('Demand forecast error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Forecast failed',
      },
      { status: 500 }
    );
  }
}

