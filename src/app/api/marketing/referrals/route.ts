import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List referrals
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const referrals = await db.referral.findMany({
      where: {
        program: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        program: true,
        referrer: true,
        referred: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: referrals });
  } catch (error) {
    apiLogger.error('Error fetching referrals', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch referrals' }, { status: 500 });
  }
}

// POST - Create referral
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programId, referrerId } = body;

    // Generate unique referral code
    const code = `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const referral = await db.referral.create({
      data: {
        programId,
        referrerId,
        referralCode: code,
      },
    });

    apiLogger.info('Referral created', { referralId: referral.id, code });

    return NextResponse.json({ success: true, data: referral });
  } catch (error) {
    apiLogger.error('Error creating referral', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create referral' }, { status: 500 });
  }
}

