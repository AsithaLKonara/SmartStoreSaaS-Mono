import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List POS terminals
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const terminals = await db.pOSTerminal.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        warehouse: true,
        _count: {
          select: {
            transactions: true,
            cashDrawers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: terminals });
  } catch (error) {
    apiLogger.error('Error fetching terminals', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch terminals' }, { status: 500 });
  }
}

// POST - Create POS terminal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { terminalName, warehouseId, deviceId, ipAddress } = body;

    // Generate terminal code
    const count = await db.pOSTerminal.count({
      where: { organizationId: session.user.organizationId },
    });
    const terminalCode = `TERM-${(count + 1).toString().padStart(4, '0')}`;

    const terminal = await db.pOSTerminal.create({
      data: {
        organizationId: session.user.organizationId,
        terminalName,
        terminalCode,
        warehouseId,
        deviceId,
        ipAddress,
      },
    });

    apiLogger.info('POS terminal created', { terminalId: terminal.id, terminalCode });

    return NextResponse.json({ success: true, data: terminal });
  } catch (error) {
    apiLogger.error('Error creating terminal', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create terminal' }, { status: 500 });
  }
}

