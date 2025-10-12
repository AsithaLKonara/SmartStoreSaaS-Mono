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
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.entryDate = {};
      if (fromDate) where.entryDate.gte = new Date(fromDate);
      if (toDate) where.entryDate.lte = new Date(toDate);
    }

    const [entries, total] = await Promise.all([
      prisma.journal_entries.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { entryDate: 'desc' },
        include: {
          journal_entry_lines: {
            include: {
              chart_of_accounts: true,
            },
          },
        },
      }),
      prisma.journal_entries.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch journal entries' },
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
      entryNumber,
      entryDate,
      description,
      reference,
      lines,
    } = body;

    // Validate required fields
    if (!entryNumber || !entryDate || !description || !lines || !Array.isArray(lines)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate journal entry lines
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Journal entry must have at least 2 lines' },
        { status: 400 }
      );
    }

    // Check if entry number already exists
    const existingEntry = await prisma.journal_entries.findFirst({
      where: {
        organizationId: session.user.organizationId,
        entryNumber,
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: 'Entry number already exists' },
        { status: 400 }
      );
    }

    // Validate debits and credits balance
    const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json(
        { success: false, message: 'Debits and credits must balance' },
        { status: 400 }
      );
    }

    // Create journal entry with lines in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journal_entries.create({
        data: {
          id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: session.user.organizationId,
          entryNumber,
          entryDate: new Date(entryDate),
          description,
          reference,
          status: 'DRAFT',
          createdBy: session.user.id,
        },
      });

      // Create journal entry lines
      const entryLines = await Promise.all(
        lines.map((line, index) =>
          tx.journal_entry_lines.create({
            data: {
              id: `jel_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              journalEntryId: entry.id,
              accountId: line.accountId,
              description: line.description,
              debit: line.debit || 0,
              credit: line.credit || 0,
              lineNumber: index + 1,
            },
          })
        )
      );

      return { entry, lines: entryLines };
    });

    return NextResponse.json({
      success: true,
      data: result.entry,
      message: 'Journal entry created successfully',
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}