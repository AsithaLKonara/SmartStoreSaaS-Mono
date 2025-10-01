export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Get cash drawer status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const terminalId = searchParams.get('terminalId');
    const status = searchParams.get('status') || 'open';

    const where: any = {};
    if (terminalId) where.terminalId = terminalId;
    if (status) where.status = status;

    const drawers = await db.cashDrawer.findMany({
      where,
      include: {
        terminal: true,
      },
      orderBy: { openedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: drawers });
  } catch (error) {
    apiLogger.error('Error fetching cash drawers', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch cash drawers' }, { status: 500 });
  }
}

// POST - Open/Close cash drawer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, terminalId, openingAmount, actualAmount, notes } = body;

    if (action === 'open') {
      const drawer = await db.cashDrawer.create({
        data: {
          terminalId,
          openedBy: session.user.id,
          openingAmount: parseFloat(openingAmount),
        },
      });

      apiLogger.info('Cash drawer opened', { drawerId: drawer.id, terminalId });
      return NextResponse.json({ success: true, data: drawer });
    } else if (action === 'close') {
      const drawer = await db.cashDrawer.findFirst({
        where: { terminalId, status: 'open' },
      });

      if (!drawer) {
        return NextResponse.json({ success: false, message: 'No open drawer found' }, { status: 404 });
      }

      const actual = parseFloat(actualAmount);
      const variance = actual - drawer.expectedAmount;

      const updatedDrawer = await db.cashDrawer.update({
        where: { id: drawer.id },
        data: {
          status: 'closed',
          actualAmount: actual,
          variance,
          closedAt: new Date(),
          closedBy: session.user.id,
          notes,
        },
      });

      apiLogger.info('Cash drawer closed', { drawerId: drawer.id, variance });
      return NextResponse.json({ success: true, data: updatedDrawer });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    apiLogger.error('Error managing cash drawer', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to manage cash drawer' }, { status: 500 });
  }
}

