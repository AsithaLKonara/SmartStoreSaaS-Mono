export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'balance-sheet';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const endDate = toDate ? new Date(toDate) : new Date();
    const startDate = fromDate ? new Date(fromDate) : new Date(endDate.getFullYear(), 0, 1);

    let reportData;

    switch (reportType) {
      case 'balance-sheet':
        reportData = await generateBalanceSheet(session.user.organizationId, endDate);
        break;
      case 'profit-loss':
        reportData = await generateProfitLoss(session.user.organizationId, startDate, endDate);
        break;
      case 'cash-flow':
        reportData = await generateCashFlow(session.user.organizationId, startDate, endDate);
        break;
      case 'trial-balance':
        reportData = await generateTrialBalance(session.user.organizationId, endDate);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      reportType,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate financial report' },
      { status: 500 }
    );
  }
}

async function generateBalanceSheet(organizationId: string, asOfDate: Date) {
  const accounts = await prisma.chart_of_accounts.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      ledger: {
        where: {
          transactionDate: { lte: asOfDate },
        },
        orderBy: { transactionDate: 'desc' },
      },
    },
  });

  const assets = accounts
    .filter(acc => acc.accountType === 'ASSET')
    .map(acc => ({
      ...acc,
      currentBalance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
    }));

  const liabilities = accounts
    .filter(acc => acc.accountType === 'LIABILITY')
    .map(acc => ({
      ...acc,
      currentBalance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
    }));

  const equity = accounts
    .filter(acc => acc.accountType === 'EQUITY')
    .map(acc => ({
      ...acc,
      currentBalance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
    }));

  const totalAssets = assets.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalEquity = equity.reduce((sum, acc) => sum + acc.currentBalance, 0);

  return {
    asOfDate: asOfDate.toISOString(),
    assets: {
      current: assets.filter(acc => acc.accountSubType === 'CURRENT_ASSET'),
      fixed: assets.filter(acc => acc.accountSubType === 'FIXED_ASSET'),
      other: assets.filter(acc => acc.accountSubType === 'OTHER_ASSET'),
      total: totalAssets,
    },
    liabilities: {
      current: liabilities.filter(acc => acc.accountSubType === 'CURRENT_LIABILITY'),
      longTerm: liabilities.filter(acc => acc.accountSubType === 'LONG_TERM_LIABILITY'),
      total: totalLiabilities,
    },
    equity: {
      accounts: equity,
      total: totalEquity,
    },
    totals: {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      balance: totalAssets - (totalLiabilities + totalEquity),
    },
  };
}

async function generateProfitLoss(organizationId: string, fromDate: Date, toDate: Date) {
  const accounts = await prisma.chart_of_accounts.findMany({
    where: {
      organizationId,
      isActive: true,
      accountType: { in: ['REVENUE', 'EXPENSE'] },
    },
    include: {
      ledger: {
        where: {
          transactionDate: { gte: fromDate, lte: toDate },
        },
        orderBy: { transactionDate: 'desc' },
      },
    },
  });

  const revenue = accounts
    .filter(acc => acc.accountType === 'REVENUE')
    .map(acc => ({
      ...acc,
      periodBalance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
    }));

  const expenses = accounts
    .filter(acc => acc.accountType === 'EXPENSE')
    .map(acc => ({
      ...acc,
      periodBalance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
    }));

  const totalRevenue = revenue.reduce((sum, acc) => sum + acc.periodBalance, 0);
  const totalExpenses = expenses.reduce((sum, acc) => sum + acc.periodBalance, 0);
  const netIncome = totalRevenue - totalExpenses;

  return {
    period: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    revenue: {
      operating: revenue.filter(acc => acc.accountSubType === 'OPERATING_REVENUE'),
      other: revenue.filter(acc => acc.accountSubType === 'OTHER_REVENUE'),
      total: totalRevenue,
    },
    expenses: {
      costOfGoodsSold: expenses.filter(acc => acc.accountSubType === 'COST_OF_GOODS_SOLD'),
      operating: expenses.filter(acc => acc.accountSubType === 'OPERATING_EXPENSE'),
      other: expenses.filter(acc => acc.accountSubType === 'OTHER_EXPENSE'),
      total: totalExpenses,
    },
    netIncome,
    grossProfit: totalRevenue - expenses
      .filter(acc => acc.accountSubType === 'COST_OF_GOODS_SOLD')
      .reduce((sum, acc) => sum + acc.periodBalance, 0),
  };
}

async function generateCashFlow(organizationId: string, fromDate: Date, toDate: Date) {
  // This is a simplified cash flow - in a real implementation, you'd need more complex logic
  const cashAccounts = await prisma.chart_of_accounts.findMany({
    where: {
      organizationId,
      isActive: true,
      name: { contains: 'cash', mode: 'insensitive' },
    },
    include: {
      ledger: {
        where: {
          transactionDate: { gte: fromDate, lte: toDate },
        },
        orderBy: { transactionDate: 'desc' },
      },
    },
  });

  const operatingActivities = cashAccounts.map(acc => ({
    account: acc.name,
    balance: acc.ledger.reduce((sum, entry) => sum + entry.balance, 0),
  }));

  return {
    period: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    operatingActivities,
    investingActivities: [],
    financingActivities: [],
    netCashFlow: operatingActivities.reduce((sum, acc) => sum + acc.balance, 0),
  };
}

async function generateTrialBalance(organizationId: string, asOfDate: Date) {
  const accounts = await prisma.chart_of_accounts.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      ledger: {
        where: {
          transactionDate: { lte: asOfDate },
        },
        orderBy: { transactionDate: 'desc' },
      },
    },
  });

  const trialBalance = accounts.map(acc => {
    const balance = acc.ledger.reduce((sum, entry) => sum + entry.balance, 0);
    return {
      accountCode: acc.code,
      accountName: acc.name,
      accountType: acc.accountType,
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
    };
  });

  const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

  return {
    asOfDate: asOfDate.toISOString(),
    accounts: trialBalance,
    totals: {
      debits: totalDebits,
      credits: totalCredits,
      balance: totalDebits - totalCredits,
    },
  };
}
