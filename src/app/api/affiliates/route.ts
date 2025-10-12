export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List affiliates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const affiliates = await db.affiliate.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            sales: true,
            payouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: affiliates });
  } catch (error) {
    apiLogger.error('Error fetching affiliates', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

// POST - Create affiliate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, commissionRate } = body;

    // Generate unique affiliate code
    const code = `AFF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const affiliate = await db.affiliate.create({
      data: {
        organizationId: session.user.organizationId,
        affiliateCode: code,
        name,
        email,
        commissionRate: parseFloat(commissionRate),
      },
    });

    apiLogger.info('Affiliate created', { affiliateId: affiliate.id, code });

    return NextResponse.json({ success: true, data: affiliate });
  } catch (error) {
    apiLogger.error('Error creating affiliate', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create affiliate' }, { status: 500 });
  }
}

