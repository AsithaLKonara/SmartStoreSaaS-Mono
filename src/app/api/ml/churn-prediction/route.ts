import { NextRequest, NextResponse } from 'next/server';
import { mlService } from '@/lib/ml/predictions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const organizationId = searchParams.get('organizationId');

    if (customerId) {
      // Single customer prediction
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      const orderCount = await prisma.order.count({
        where: { customerId },
      });

      const orderStats = await prisma.order.aggregate({
        where: { customerId },
        _avg: { total: true },
      });

      const lastOrder = customer.orders[0];
      const daysSinceLastOrder = lastOrder
        ? Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const prediction = await mlService.predictChurn(customerId, {
        name: customer.name,
        daysSinceLastOrder,
        totalOrders: orderCount,
        avgOrderValue: Number(orderStats._avg.total || 0),
      });

      return NextResponse.json({
        success: true,
        prediction,
        note: 'This is a placeholder implementation. Integrate real ML model for production.',
      });
    } else {
      // Get all high-risk customers
      const customers = await prisma.customer.findMany({
        where: organizationId ? { organizationId } : undefined,
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        take: 50,
      });

      const predictions = await Promise.all(
        customers.map(async (customer) => {
          const orderCount = await prisma.order.count({
            where: { customerId: customer.id },
          });

          const orderStats = await prisma.order.aggregate({
            where: { customerId: customer.id },
            _avg: { total: true },
          });

          const lastOrder = customer.orders[0];
          const daysSinceLastOrder = lastOrder
            ? Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          return mlService.predictChurn(customer.id, {
            name: customer.name,
            daysSinceLastOrder,
            totalOrders: orderCount,
            avgOrderValue: Number(orderStats._avg.total || 0),
          });
        })
      );

      // Filter high-risk only
      const highRisk = predictions.filter(p => p.riskLevel === 'HIGH');

      return NextResponse.json({
        success: true,
        predictions: highRisk,
        total: highRisk.length,
        note: 'This is a placeholder implementation. Integrate real ML model for production.',
      });
    }
  } catch (error: any) {
    console.error('Churn prediction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Prediction failed',
      },
      { status: 500 }
    );
  }
}

