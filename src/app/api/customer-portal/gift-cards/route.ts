import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const giftCards = await prisma.giftCard.findMany({
      where: {
        OR: [
          { issuedTo: session.user.id },
          { issuedToEmail: session.user.email }
        ]
      }
    });

    logger.info({
      message: 'Gift cards fetched',
      context: { userId: session.user.id, count: giftCards.length }
    });

    return NextResponse.json({ success: true, data: giftCards });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch gift cards', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch gift cards' }, { status: 500 });
  }
}