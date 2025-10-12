import { NextRequest, NextResponse } from 'next/server';
import { churnPredictionModel } from '@/lib/ml/churnPrediction';
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
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Get customer metrics
      const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      const orderStats = await prisma.order.aggregate({
        where: { customerId },
        _avg: { total: true },
        _sum: { total: true },
      });

      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

      const lastMonthOrders = await prisma.order.count({
        where: {
          customerId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        }
      });

      const prevMonthOrders = await prisma.order.count({
        where: {
          customerId,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd }
        }
      });

      const lastOrder = orders[0];
      const firstOrder = orders[orders.length - 1];
      
      const daysSinceLastOrder = lastOrder
        ? Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const daysSinceFirstOrder = firstOrder
        ? Math.floor((now.getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const orderFrequency = daysSinceFirstOrder > 0
        ? (orders.length / daysSinceFirstOrder) * 30 // orders per month
        : 0;

      // Build customer data for prediction
      const customerData = {
        customerId: customer.id,
        customerName: customer.name,
        totalOrders: orders.length,
        totalSpent: Number(orderStats._sum.total || 0),
        avgOrderValue: Number(orderStats._avg.total || 0),
        daysSinceLastOrder,
        daysSinceFirstOrder,
        orderFrequency,
        returnsCount: 0, // Would come from returns table
        complaintsCount: 0, // Would come from support tickets
        loyaltyPoints: 0, // Would come from loyalty table
        emailEngagement: 0.5, // Would come from email tracking
        lastMonthOrders,
        previousMonthOrders: prevMonthOrders,
      };

      // Use real ML model
      const prediction = await churnPredictionModel.predictChurn(customerData);

      return NextResponse.json({
        success: true,
        data: prediction,
        message: 'Churn prediction generated using weighted feature model',
      });
    } else {
      // Get all customers and predict
      const customers = await prisma.customer.findMany({
        where: organizationId ? { organizationId } : undefined,
        take: 100,
      });

      const predictions = await Promise.all(
        customers.map(async (customer) => {
          const orders = await prisma.order.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
          });

          const orderStats = await prisma.order.aggregate({
            where: { customerId: customer.id },
            _avg: { total: true },
            _sum: { total: true },
          });

          const now = new Date();
          const lastOrder = orders[0];
          const firstOrder = orders[orders.length - 1];
          
          const daysSinceLastOrder = lastOrder
            ? Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          const daysSinceFirstOrder = firstOrder
            ? Math.floor((now.getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          const orderFrequency = daysSinceFirstOrder > 0
            ? (orders.length / daysSinceFirstOrder) * 30
            : 0;

          const customerData = {
            customerId: customer.id,
            customerName: customer.name,
            totalOrders: orders.length,
            totalSpent: Number(orderStats._sum.total || 0),
            avgOrderValue: Number(orderStats._avg.total || 0),
            daysSinceLastOrder,
            daysSinceFirstOrder,
            orderFrequency,
            returnsCount: 0,
            complaintsCount: 0,
            loyaltyPoints: 0,
            emailEngagement: 0.5,
            lastMonthOrders: 0,
            previousMonthOrders: 0,
          };

          return churnPredictionModel.predictChurn(customerData);
        })
      );

      // Filter high and critical risk only
      const atRisk = predictions.filter(p => 
        p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
      );

      return NextResponse.json({
        success: true,
        data: atRisk,
        total: atRisk.length,
        message: 'Churn predictions generated for at-risk customers',
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

