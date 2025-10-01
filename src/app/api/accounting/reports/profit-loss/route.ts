export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Get revenue accounts (type = REVENUE)
    const revenueAccounts = await db.chartOfAccounts.findMany({
      where: {
        organizationId,
        accountType: 'REVENUE',
        isActive: true,
      },
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        },
      },
    });

    // Get expense accounts (type = EXPENSE)
    const expenseAccounts = await db.chartOfAccounts.findMany({
      where: {
        organizationId,
        accountType: 'EXPENSE',
        isActive: true,
      },
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        },
      },
    });

    // Calculate totals
    const revenue = revenueAccounts.map(account => {
      const total = account.ledgerEntries.reduce((sum, entry) => {
        return sum + (entry.credit - entry.debit); // Revenue increases with credits
      }, 0);
      return {
        code: account.code,
        name: account.name,
        amount: total,
      };
    });

    const expenses = expenseAccounts.map(account => {
      const total = account.ledgerEntries.reduce((sum, entry) => {
        return sum + (entry.debit - entry.credit); // Expenses increase with debits
      }, 0);
      return {
        code: account.code,
        name: account.name,
        amount: total,
        subType: account.accountSubType,
      };
    });

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const cogs = expenses
      .filter(e => e.subType === 'COST_OF_GOODS_SOLD')
      .reduce((sum, item) => sum + item.amount, 0);
    const operating = expenses
      .filter(e => e.subType === 'OPERATING_EXPENSE')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    const grossProfit = totalRevenue - cogs;
    const operatingIncome = grossProfit - operating;
    const netProfit = totalRevenue - totalExpenses;

    const report = {
      period: { startDate, endDate },
      revenue: {
        items: revenue,
        total: totalRevenue,
      },
      expenses: {
        costOfGoodsSold: {
          items: expenses.filter(e => e.subType === 'COST_OF_GOODS_SOLD'),
          total: cogs,
        },
        operating: {
          items: expenses.filter(e => e.subType === 'OPERATING_EXPENSE'),
          total: operating,
        },
        other: {
          items: expenses.filter(e => e.subType === 'OTHER_EXPENSE'),
          total: expenses.filter(e => e.subType === 'OTHER_EXPENSE').reduce((sum, item) => sum + item.amount, 0),
        },
        total: totalExpenses,
      },
      summary: {
        grossProfit,
        operatingIncome,
        netProfit,
        grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      },
    };

    apiLogger.info('P&L report generated', { organizationId, period: { startDate, endDate } });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    apiLogger.error('Error generating P&L report', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to generate report' }, { status: 500 });
  }
}

