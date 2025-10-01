import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List email campaigns
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await db.emailCampaign.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            sends: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    apiLogger.error('Error fetching campaigns', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST - Create email campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, htmlContent, textContent, campaignType, scheduledAt } = body;

    const campaign = await db.emailCampaign.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        subject,
        htmlContent,
        textContent,
        campaignType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    apiLogger.info('Email campaign created', { campaignId: campaign.id });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    apiLogger.error('Error creating campaign', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create campaign' }, { status: 500 });
  }
}

