import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List journal entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const entries = await db.journalEntry.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(status && { status: status as any }),
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.journalEntry.count({
      where: {
        organizationId: session.user.organizationId,
        ...(status && { status: status as any }),
      },
    });

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
    apiLogger.error('Error fetching journal entries', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch entries' }, { status: 500 });
  }
}

// POST - Create journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entryDate, description, reference, lines } = body;

    // Validate lines
    if (!lines || lines.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Journal entry must have at least 2 lines' },
        { status: 400 }
      );
    }

    // Validate double-entry (debits = credits)
    const totalDebits = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredits = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Debits must equal credits', 
          details: { debits: totalDebits, credits: totalCredits } 
        },
        { status: 400 }
      );
    }

    // Generate entry number
    const lastEntry = await db.journalEntry.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { entryNumber: 'desc' },
    });

    const nextNumber = lastEntry 
      ? parseInt(lastEntry.entryNumber.split('-')[1]) + 1 
      : 1;
    const entryNumber = `JE-${String(nextNumber).padStart(5, '0')}`;

    // Create journal entry with lines
    const entry = await db.journalEntry.create({
      data: {
        organizationId: session.user.organizationId,
        entryNumber,
        entryDate: new Date(entryDate),
        description,
        reference,
        createdBy: session.user.id,
        lines: {
          create: lines.map((line: any, index: number) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            lineNumber: index + 1,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    apiLogger.info('Journal entry created', { entryId: entry.id, entryNumber });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    apiLogger.error('Error creating journal entry', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create entry' }, { status: 500 });
  }
}

