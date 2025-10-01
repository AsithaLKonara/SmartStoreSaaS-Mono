import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List gift cards
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const giftCards = await db.giftCard.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: giftCards });
  } catch (error) {
    apiLogger.error('Error fetching gift cards', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch gift cards' }, { status: 500 });
  }
}

// POST - Create gift card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { initialValue, recipientEmail, recipientName, senderName, message, expiresAt } = body;

    // Generate unique code
    const code = `GC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const giftCard = await db.giftCard.create({
      data: {
        organizationId: session.user.organizationId,
        code,
        initialValue: parseFloat(initialValue),
        currentBalance: parseFloat(initialValue),
        recipientEmail,
        recipientName,
        senderName,
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        purchasedBy: session.user.id,
      },
    });

    apiLogger.info('Gift card created', { giftCardId: giftCard.id, code });

    return NextResponse.json({ success: true, data: giftCard });
  } catch (error) {
    apiLogger.error('Error creating gift card', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create gift card' }, { status: 500 });
  }
}

