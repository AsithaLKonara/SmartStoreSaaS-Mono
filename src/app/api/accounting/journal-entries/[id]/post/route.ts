import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// POST - Post journal entry to ledger
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get journal entry
    const entry = await db.journalEntry.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ success: false, message: 'Entry not found' }, { status: 404 });
    }

    if (entry.status === 'POSTED') {
      return NextResponse.json({ success: false, message: 'Entry already posted' }, { status: 400 });
    }

    // Post to ledger (transaction for atomicity)
    await db.$transaction(async (tx) => {
      // Update entry status
      await tx.journalEntry.update({
        where: { id: entry.id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: session.user.id,
        },
      });

      // Create ledger entries for each line
      for (const line of entry.lines) {
        // Get current balance
        const lastEntry = await tx.ledger.findFirst({
          where: { accountId: line.accountId },
          orderBy: { transactionDate: 'desc' },
        });

        const previousBalance = lastEntry?.balance || 0;
        const debitAmount = line.debit || 0;
        const creditAmount = line.credit || 0;

        // Calculate new balance based on account type
        let newBalance = previousBalance;
        if (line.account.accountType === 'ASSET' || line.account.accountType === 'EXPENSE') {
          newBalance = previousBalance + debitAmount - creditAmount;
        } else {
          newBalance = previousBalance + creditAmount - debitAmount;
        }

        // Create ledger entry
        await tx.ledger.create({
          data: {
            organizationId: session.user.organizationId,
            accountId: line.accountId,
            transactionDate: entry.entryDate,
            description: line.description || entry.description,
            reference: entry.entryNumber,
            referenceType: 'journal_entry',
            referenceId: entry.id,
            debit: debitAmount,
            credit: creditAmount,
            balance: newBalance,
          },
        });

        // Update account balance
        await tx.chartOfAccounts.update({
          where: { id: line.accountId },
          data: { balance: newBalance },
        });
      }
    });

    apiLogger.info('Journal entry posted to ledger', { entryId: entry.id, entryNumber: entry.entryNumber });

    return NextResponse.json({
      success: true,
      message: 'Entry posted to ledger successfully',
    });
  } catch (error) {
    apiLogger.error('Error posting entry', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to post entry' }, { status: 500 });
  }
}

