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

        // Check if OpenAI API key is configured
        let aiInsights = 'I apologize, but the AI analytics service is not currently configured. Please contact your administrator to set up the OpenAI API key.';
        
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
          try {
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

            aiInsights = completion.choices[0]?.message?.content || 'Unable to generate insights.';
          } catch (openaiError) {
            console.error('OpenAI API error:', openaiError);
            aiInsights = 'I apologize, but I encountered an error while processing your request. Please try again later.';
          }
        }

        return NextResponse.json({
          insights: aiInsights,
          data: analyticsData,
          query,
        });

      case 'GET':
        // Get AI analytics history (simplified)
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Return empty analytics history for now
        return NextResponse.json({
          analytics: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
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

    return {
      sales: {
        totalRevenue: salesData._sum.totalAmount || 0,
        totalOrders: salesData._count || 0,
        averageOrderValue: salesData._count > 0 ? (salesData._sum.totalAmount || 0) / salesData._count : 0,
      },
      customers: {
        newCustomers: customerData._count || 0,
      },
      orders: {
        statusDistribution: orderStatusData,
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
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});