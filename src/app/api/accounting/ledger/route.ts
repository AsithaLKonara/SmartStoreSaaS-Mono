import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Query general ledger
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate) {
      where.transactionDate = { ...where.transactionDate, gte: new Date(startDate) };
    }

    if (endDate) {
      where.transactionDate = { ...where.transactionDate, lte: new Date(endDate) };
    }

    const entries = await db.ledger.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.ledger.count({ where });

    // Calculate summary
    const summary = await db.ledger.aggregate({
      where,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    apiLogger.info('Ledger queried', { 
      count: entries.length,
      accountId,
      organizationId: session.user.organizationId 
    });

    return NextResponse.json({
      success: true,
      data: entries,
      summary: {
        totalDebits: summary._sum.debit || 0,
        totalCredits: summary._sum.credit || 0,
        balance: (summary._sum.debit || 0) - (summary._sum.credit || 0),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    apiLogger.error('Error querying ledger', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to query ledger' }, { status: 500 });
  }
}

