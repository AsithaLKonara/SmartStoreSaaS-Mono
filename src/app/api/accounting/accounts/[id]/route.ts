export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Get single account
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const account = await db.chartOfAccounts.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        parent: true,
        children: true,
        taxRate: true,
        ledgerEntries: {
          take: 10,
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate current balance from ledger
    const balanceResult = await db.ledger.aggregate({
      where: {
        accountId: params.id,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const calculatedBalance = (balanceResult._sum.debit || 0) - (balanceResult._sum.credit || 0);

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        calculatedBalance,
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching account', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, parentId, taxEnabled, taxRateId, isActive } = body;

    // Verify account exists and belongs to organization
    const existing = await db.chartOfAccounts.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Update account
    const account = await db.chartOfAccounts.update({
      where: { id: params.id },
      data: {
        name,
        description,
        parentId,
        taxEnabled,
        taxRateId,
        isActive,
      },
      include: {
        parent: true,
        taxRate: true,
      },
    });

    apiLogger.info('Account updated', { accountId: account.id, name });

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    apiLogger.error('Error updating account', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate account (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if account has transactions
    const hasTransactions = await db.ledger.count({
      where: { accountId: params.id },
    });

    if (hasTransactions > 0) {
      // Soft delete only
      const account = await db.chartOfAccounts.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      apiLogger.info('Account deactivated (has transactions)', { accountId: params.id });

      return NextResponse.json({
        success: true,
        data: account,
        message: 'Account deactivated (cannot delete account with transactions)',
      });
    } else {
      // Hard delete if no transactions
      await db.chartOfAccounts.delete({
        where: { id: params.id },
      });

      apiLogger.info('Account deleted', { accountId: params.id });

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
      });
    }
  } catch (error) {
    apiLogger.error('Error deleting account', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

