import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withSecurity } from '@/lib/security';

export const GET = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';
    const period = searchParams.get('period') || '30';

    // Enhanced analytics data
    const enhancedData = {
      organizationId,
      period: parseInt(period),
      timestamp: new Date().toISOString(),
      metrics: {
        revenue: {
          total: 125000,
          change: 12.5,
          trend: 'up',
          breakdown: {
            online: 75000,
            offline: 50000
          }
        },
        orders: {
          total: 1250,
          change: 8.3,
          trend: 'up',
          averageOrderValue: 100
        },
        customers: {
          total: 2500,
          change: 15.2,
          trend: 'up',
          newCustomers: 180,
          returningCustomers: 1070
        },
        products: {
          total: 450,
          change: 5.1,
          trend: 'up',
          topSelling: 25,
          lowStock: 12
        }
      },
      insights: {
        topProducts: [
          { id: '1', name: 'Premium Headphones', sales: 150, revenue: 15000 },
          { id: '2', name: 'Smart Watch', sales: 120, revenue: 12000 },
          { id: '3', name: 'Wireless Speaker', sales: 95, revenue: 9500 }
        ],
        recentOrders: [
          { id: 'ORD-001', customer: 'John Doe', amount: 299.99, status: 'delivered' },
          { id: 'ORD-002', customer: 'Jane Smith', amount: 149.99, status: 'shipped' },
          { id: 'ORD-003', customer: 'Bob Johnson', amount: 199.99, status: 'processing' }
        ],
        aiInsights: {
          demandForecasts: [
            { product: 'Premium Headphones', forecast: 180, confidence: 0.85 },
            { product: 'Smart Watch', forecast: 140, confidence: 0.92 }
          ],
          churnPredictions: [
            { customerId: 'CUST-001', risk: 'LOW', probability: 0.15 },
            { customerId: 'CUST-002', risk: 'MEDIUM', probability: 0.45 }
          ],
          aiEnabled: true
        }
      }
    };

    return NextResponse.json(enhancedData);
  })
);
