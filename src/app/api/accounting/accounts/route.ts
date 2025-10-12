export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';
import { AccountType, AccountSubType } from '@prisma/client';

// GET - List all accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('type') as AccountType | null;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const accounts = await db.chartOfAccounts.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(accountType && { accountType }),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        parent: true,
        children: true,
        taxRate: true,
      },
      orderBy: { code: 'asc' },
    });

    // Build hierarchy
    const accountMap = new Map(accounts.map(acc => [acc.id, { ...acc, children: [] }]));
    const rootAccounts: any[] = [];

    accounts.forEach(account => {
      const acc = accountMap.get(account.id)!;
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(acc);
        }
      } else {
        rootAccounts.push(acc);
      }
    });

    apiLogger.info('Chart of Accounts fetched', { 
      count: accounts.length, 
      organizationId: session.user.organizationId 
    });

    return NextResponse.json({
      success: true,
      data: rootAccounts,
      flat: accounts,
      count: accounts.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching accounts', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      code, 
      name, 
      description, 
      accountType, 
      accountSubType, 
      parentId, 
      currency, 
      taxEnabled, 
      taxRateId 
    } = body;

    // Validate required fields
    if (!code || !name || !accountType || !accountSubType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: code, name, accountType, accountSubType' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.chartOfAccounts.findFirst({
      where: {
        organizationId: session.user.organizationId,
        code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Account code already exists' },
        { status: 400 }
      );
    }

    // Create account
    const account = await db.chartOfAccounts.create({
      data: {
        organizationId: session.user.organizationId,
        code,
        name,
        description,
        accountType,
        accountSubType,
        parentId,
        currency: currency || 'USD',
        taxEnabled: taxEnabled || false,
        taxRateId,
      },
      include: {
        parent: true,
        taxRate: true,
      },
    });

    apiLogger.info('Account created', { accountId: account.id, code, name });

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    apiLogger.error('Error creating account', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}

