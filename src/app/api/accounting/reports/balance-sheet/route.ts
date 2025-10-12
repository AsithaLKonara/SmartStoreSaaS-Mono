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
    const asOfDate = searchParams.get('asOfDate') || new Date().toISOString();
    const organizationId = session.user.organizationId;

    // Get all accounts with their balances as of the specified date
    const accounts = await db.chartOfAccounts.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              lte: new Date(asOfDate),
            },
          },
        },
      },
    });

    // Calculate balances for each account
    const accountBalances = accounts.map(account => {
      let balance = 0;
      account.ledgerEntries.forEach(entry => {
        if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
          balance += entry.debit - entry.credit;
        } else {
          balance += entry.credit - entry.debit;
        }
      });
      return {
        ...account,
        calculatedBalance: balance,
      };
    });

    // Group by account type
    const assets = accountBalances.filter(a => a.accountType === 'ASSET');
    const liabilities = accountBalances.filter(a => a.accountType === 'LIABILITY');
    const equity = accountBalances.filter(a => a.accountType === 'EQUITY');

    const totalAssets = assets.reduce((sum, a) => sum + a.calculatedBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.calculatedBalance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.calculatedBalance, 0);

    // Accounting equation check
    const equation = {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };

    const report = {
      asOfDate,
      assets: {
        current: assets.filter(a => a.accountSubType === 'CURRENT_ASSET').map(a => ({
          code: a.code,
          name: a.name,
          balance: a.calculatedBalance,
        })),
        fixed: assets.filter(a => a.accountSubType === 'FIXED_ASSET').map(a => ({
          code: a.code,
          name: a.name,
          balance: a.calculatedBalance,
        })),
        total: totalAssets,
      },
      liabilities: {
        current: liabilities.filter(a => a.accountSubType === 'CURRENT_LIABILITY').map(a => ({
          code: a.code,
          name: a.name,
          balance: a.calculatedBalance,
        })),
        longTerm: liabilities.filter(a => a.accountSubType === 'LONG_TERM_LIABILITY').map(a => ({
          code: a.code,
          name: a.name,
          balance: a.calculatedBalance,
        })),
        total: totalLiabilities,
      },
      equity: {
        items: equity.map(a => ({
          code: a.code,
          name: a.name,
          balance: a.calculatedBalance,
        })),
        total: totalEquity,
      },
      equation,
    };

    apiLogger.info('Balance Sheet generated', { organizationId, asOfDate });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    apiLogger.error('Error generating Balance Sheet', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to generate report' }, { status: 500 });
  }
}

