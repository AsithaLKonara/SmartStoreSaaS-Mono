/**
 * Accounting Summary API Route
 * 
 * Provides high-level financial totals for the dashboard
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requirePermission(Permission.ACCOUNTING_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        return NextResponse.json({ success: false, message: 'Organization required' }, { status: 400 });
      }

      // Aggregate assets, revenue, and expenses from Chart of Accounts
      const accounts = await prisma.chartOfAccount.findMany({
        where: { organizationId },
        select: {
          accountType: true,
          balance: true
        }
      });

      const summary = {
        totalAssets: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
      };

      accounts.forEach(acc => {
        const balance = acc.balance || 0;
        // Map account types to summary categories
        // Types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
        if (acc.accountType === 'ASSET') {
          summary.totalAssets += balance;
        } else if (acc.accountType === 'REVENUE') {
          summary.totalRevenue += balance;
        } else if (acc.accountType === 'EXPENSE') {
          summary.totalExpenses += balance;
        }
      });

      summary.netIncome = summary.totalRevenue - summary.totalExpenses;

      logger.info({
        message: 'Accounting summary generated',
        context: { organizationId, userId: user.id }
      });

      return NextResponse.json(successResponse(summary));
    } catch (error) {
      logger.error({
        message: 'Failed to generate accounting summary',
        error: error instanceof Error ? error : new Error(String(error))
      });
      return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
  }
);
