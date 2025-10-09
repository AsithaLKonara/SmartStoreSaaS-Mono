import { NextRequest, NextResponse } from 'next/server';
import {
  createCampaign,
  scheduleCampaign,
  sendCampaign,
  getCampaignAnalytics,
  EmailTemplates,
} from '@/lib/campaigns/email-builder';

export const dynamic = 'force-dynamic';

// Get campaigns or analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const action = searchParams.get('action');

    if (campaignId && action === 'analytics') {
      const analytics = await getCampaignAnalytics(campaignId);
      return NextResponse.json({ success: true, data: analytics });
    }

    if (action === 'templates') {
      return NextResponse.json({ success: true, data: EmailTemplates });
    }

    // List campaigns would go here
    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'send') {
      const result = await sendCampaign(data.campaignId, data.testMode);
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.stats,
          message: 'Campaign sent successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    }

    const result = await createCampaign(data);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.campaign,
        message: 'Campaign created successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Campaign operation failed' },
      { status: 500 }
    );
  }
}

// Update campaign
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, scheduledAt } = body;

    if (!campaignId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Campaign ID and scheduled date are required' },
        { status: 400 }
      );
    }

    const result = await scheduleCampaign(campaignId, new Date(scheduledAt));

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Campaign scheduled successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Schedule campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Campaign scheduling failed' },
      { status: 500 }
    );
  }
}
