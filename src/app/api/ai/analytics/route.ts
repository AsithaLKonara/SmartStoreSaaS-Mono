import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'POST':
        // AI Analytics insights
        const { query, dateRange, filters } = await request.json();

        if (!query) {
          return NextResponse.json(
            { error: 'Missing required field: query' },
            { status: 400 }
          );
        }

        // Get analytics data based on query
        const analyticsData = await getAnalyticsData(user.organizationId, dateRange, filters);

        // Prepare context for AI
        const systemPrompt = `You are an AI analytics expert for an e-commerce business. 
        Analyze the provided data and answer the user's query with actionable insights.
        Be specific, data-driven, and provide recommendations when appropriate.`;

        const userPrompt = `Query: ${query}

        Data: ${JSON.stringify(analyticsData, null, 2)}

        Please provide a comprehensive analysis and insights based on this data.`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });

        const aiInsights = completion.choices[0]?.message?.content || 'Unable to generate insights.';

        // Save AI analytics record
        await prisma.aiAnalytics.create({
          data: {
            organizationId: user.organizationId,
            query,
            insights: aiInsights,
            dataContext: JSON.stringify(analyticsData),
            filters: filters ? JSON.stringify(filters) : null,
          },
        });

        return NextResponse.json({
          insights: aiInsights,
          data: analyticsData,
          query,
        });

      case 'GET':
        // Get AI analytics history
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const [aiAnalytics, total] = await Promise.all([
          prisma.aiAnalytics.findMany({
            where: {
              organizationId: user.organizationId,
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.aiAnalytics.count({
            where: {
              organizationId: user.organizationId,
            },
          }),
        ]);

        return NextResponse.json({
          analytics: aiAnalytics.map(item => ({
            ...item,
            dataContext: item.dataContext ? JSON.parse(item.dataContext) : null,
            filters: item.filters ? JSON.parse(item.filters) : null,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('AI Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(organizationId: string, dateRange?: any, filters?: any) {
  try {
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    // Get sales data
    const salesData = await prisma.order.aggregate({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Get product performance
    const productPerformance = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    // Get customer analytics
    const customerData = await prisma.customer.aggregate({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Get order status distribution
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Get daily sales trend
    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as orderCount,
        SUM(total) as totalSales
      FROM "Order"
      WHERE organizationId = ${organizationId}
        AND createdAt >= ${startDate}
        AND createdAt <= ${endDate}
      GROUP BY DATE(createdAt)
      ORDER BY date
    `;

    return {
      sales: {
        totalRevenue: salesData._sum.totalAmount || 0,
        totalOrders: salesData._count || 0,
        averageOrderValue: salesData._count > 0 ? (salesData._sum.totalAmount || 0) / salesData._count : 0,
      },
      products: productPerformance,
      customers: {
        newCustomers: customerData._count || 0,
      },
      orders: {
        statusDistribution: orderStatusData,
      },
      trends: {
        dailySales,
      },
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {};
  }
}

// Export handlers with appropriate authentication
export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});