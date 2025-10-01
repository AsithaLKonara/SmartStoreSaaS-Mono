import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Get white label settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const whiteLabel = await db.whiteLabel.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    return NextResponse.json({ success: true, data: whiteLabel });
  } catch (error) {
    apiLogger.error('Error fetching white label settings', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST/PUT - Update white label settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const whiteLabel = await db.whiteLabel.upsert({
      where: { organizationId: session.user.organizationId },
      create: {
        organizationId: session.user.organizationId,
        ...body,
      },
      update: body,
    });

    apiLogger.info('White label settings updated', { organizationId: session.user.organizationId });

    return NextResponse.json({ success: true, data: whiteLabel });
  } catch (error) {
    apiLogger.error('Error updating white label settings', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}

