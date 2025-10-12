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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const accountType = searchParams.get('accountType');
    const search = searchParams.get('search');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (accountType) {
      where.accountType = accountType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.chart_of_accounts.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          tax_rates: true,
          _count: {
            select: {
              journal_entry_lines: true,
              ledger: true,
            },
          },
        },
      }),
      prisma.chart_of_accounts.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chart of accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      accountType,
      accountSubType,
      parentId,
      balance,
      currency,
      taxEnabled,
      taxRateId,
    } = body;

    // Validate required fields
    if (!code || !name || !accountType || !accountSubType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingAccount = await prisma.chart_of_accounts.findFirst({
      where: {
        organizationId: session.user.organizationId,
        code,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: 'Account code already exists' },
        { status: 400 }
      );
    }

    const account = await prisma.chart_of_accounts.create({
      data: {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: session.user.organizationId,
        code,
        name,
        description,
        accountType,
        accountSubType,
        parentId,
        balance: balance || 0,
        currency: currency || 'USD',
        taxEnabled: taxEnabled || false,
        taxRateId,
      },
      include: {
        tax_rates: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: account,
      message: 'Chart of account created successfully',
    });
  } catch (error) {
    console.error('Error creating chart of account:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create chart of account' },
      { status: 500 }
    );
  }
}
