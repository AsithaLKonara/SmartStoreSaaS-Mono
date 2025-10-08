import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    // Billing dashboard data
    const billingData = {
      organizationId,
      timestamp: new Date().toISOString(),
      overview: {
        currentBalance: 1250.50,
        totalInvoices: 45,
        paidInvoices: 42,
        pendingInvoices: 3,
        overdueInvoices: 1
      },
      revenue: {
        thisMonth: 125000,
        lastMonth: 118000,
        change: 5.9,
        trend: 'up'
      },
      expenses: {
        thisMonth: 45000,
        lastMonth: 42000,
        change: 7.1,
        trend: 'up',
        breakdown: {
          hosting: 500,
          integrations: 1200,
          support: 800,
          marketing: 2500
        }
      },
      recentTransactions: [
        {
          id: 'txn-001',
          type: 'payment',
          amount: 299.99,
          status: 'completed',
          date: '2024-01-15T10:30:00Z',
          description: 'Order #ORD-001'
        },
        {
          id: 'txn-002',
          type: 'refund',
          amount: -149.99,
          status: 'completed',
          date: '2024-01-14T15:45:00Z',
          description: 'Refund for Order #ORD-002'
        },
        {
          id: 'txn-003',
          type: 'payment',
          amount: 199.99,
          status: 'pending',
          date: '2024-01-15T16:20:00Z',
          description: 'Order #ORD-003'
        }
      ],
      upcomingPayments: [
        {
          id: 'up-001',
          description: 'Monthly hosting fee',
          amount: 500,
          dueDate: '2024-01-20T00:00:00Z'
        },
        {
          id: 'up-002',
          description: 'Integration service fee',
          amount: 1200,
          dueDate: '2024-01-25T00:00:00Z'
        }
      ]
    };

    return NextResponse.json(billingData);
});
