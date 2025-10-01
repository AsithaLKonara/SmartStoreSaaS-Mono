import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db.bankAccount.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    apiLogger.error('Error fetching bank accounts', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountName, bankName, accountNumber, accountType, currency } = body;

    const account = await db.bankAccount.create({
      data: {
        organizationId: session.user.organizationId,
        accountName,
        bankName,
        accountNumber,
        accountType,
        currency: currency || 'USD',
      },
    });

    apiLogger.info('Bank account created', { accountId: account.id });

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    apiLogger.error('Error creating bank account', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create account' }, { status: 500 });
  }
}

