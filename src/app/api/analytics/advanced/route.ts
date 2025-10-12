import { NextRequest, NextResponse } from 'next/server';
import {
  getAdvancedAnalytics,
  getProductPerformance,
  getCustomerAnalytics,
  getSalesTrends,
} from '@/lib/analytics/advanced';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type') || 'summary';
    const days = parseInt(searchParams.get('days') || '30');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const period = { start, end };

    let data: any;

    switch (type) {
      case 'summary':
        data = await getAdvancedAnalytics(organizationId, period);
        break;

      case 'products':
        data = await getProductPerformance(organizationId, period);
        break;

      case 'customers':
        data = await getCustomerAnalytics(organizationId, period);
        break;

      case 'trends':
        const interval = searchParams.get('interval') as 'day' | 'week' | 'month' || 'day';
        data = await getSalesTrends(organizationId, period, interval);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      period,
      data,
    });
  } catch (error: any) {
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}

