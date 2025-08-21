import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictiveAnalytics';

const predictiveEngine = new PredictiveAnalyticsEngine();

// GET - Get various predictions and forecasts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // 'demand', 'churn', 'revenue', 'all'
    const productIds = searchParams.get('productIds')?.split(',');
    const customerIds = searchParams.get('customerIds')?.split(',');
    const periods = parseInt(searchParams.get('periods') || '3');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    let results: Record<string, any> = {};

    if (type === 'demand' || type === 'all') {
      results.demandForecast = await predictiveEngine.predictDemand(
        organizationId,
        productIds
      );
    }

    if (type === 'churn' || type === 'all') {
      results.customerChurn = await predictiveEngine.predictCustomerChurn(
        organizationId,
        customerIds
      );
    }

    if (type === 'revenue' || type === 'all') {
      results.revenueForecast = await predictiveEngine.forecastRevenue(
        organizationId,
        periods
      );
    }

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        type: type || 'all',
        organizationId,
        generatedAt: new Date().toISOString(),
        algorithm: 'Statistical Analysis + Machine Learning'
      }
    });
  } catch (error) {
    console.error('Predictive analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Generate specific prediction type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, organizationId, parameters } = body;

    if (!type || !organizationId) {
      return NextResponse.json({
        error: 'Prediction type and organization ID are required'
      }, { status: 400 });
    }

    let result: any = {};

    switch (type) {
      case 'demand':
        result = await predictiveEngine.predictDemand(
          organizationId,
          parameters?.productIds
        );
        break;

      case 'churn':
        result = await predictiveEngine.predictCustomerChurn(
          organizationId,
          parameters?.customerIds
        );
        break;

      case 'revenue':
        result = await predictiveEngine.forecastRevenue(
          organizationId,
          parameters?.periods || 3
        );
        break;

      default:
        return NextResponse.json({
          error: 'Invalid prediction type. Supported: demand, churn, revenue'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        type,
        organizationId,
        parameters,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Specific prediction generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
