import { NextRequest, NextResponse } from 'next/server';
import { demandForecastingService } from '@/lib/ml/demandForecasting';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const organizationId = searchParams.get('organizationId');
    const periods = parseInt(searchParams.get('periods') || '7');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
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
        createdAt: 'asc',
      },
      take: 90, // Last 90 orders
    });

    // Convert to forecast data format
    const forecastData = historicalOrders.map(order => ({
      date: order.createdAt,
      quantity: order.quantity,
    }));

    // Generate forecast using real ML model
    const forecast = await demandForecastingService.forecastProductDemand(
      productId,
      product.name,
      forecastData,
      periods
    );

    return NextResponse.json({
      success: true,
      data: forecast,
      message: 'Demand forecast generated using Holt-Winters model',
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

