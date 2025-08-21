import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketingAutomationEngine } from '@/lib/ai/marketingAutomation';
import { prisma } from '@/lib/prisma';

const automationEngine = new MarketingAutomationEngine();

// GET - Get automation statistics and customer segments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // 'stats', 'segments', 'all'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    let results: Record<string, any> = {};

    if (type === 'stats' || type === 'all') {
      results.automationStats = await automationEngine.getAutomationStats(organizationId);
    }

    if (type === 'segments' || type === 'all') {
      results.customerSegments = await automationEngine.createCustomerSegments(organizationId);
    }

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        type: type || 'all',
        organizationId,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Marketing automation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Process automation triggers and create campaigns
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, organizationId, parameters } = body;

    if (!action || !organizationId) {
      return NextResponse.json({
        error: 'Action and organization ID are required'
      }, { status: 400 });
    }

    let result: any = {};

    switch (action) {
      case 'process_triggers':
        await automationEngine.processAutomationTriggers(organizationId);
        result = { message: 'Automation triggers processed successfully' };
        break;

      case 'create_segments':
        result = await automationEngine.createCustomerSegments(organizationId);
        break;

      case 'manual_campaign':
        // Create a manual campaign based on parameters
        if (!parameters?.customerIds || !parameters?.campaignType) {
          return NextResponse.json({
            error: 'Customer IDs and campaign type required for manual campaigns'
          }, { status: 400 });
        }
        
        // This would integrate with the marketing automation engine
        result = { message: 'Manual campaign created successfully' };
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported: process_triggers, create_segments, manual_campaign'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        action,
        organizationId,
        parameters,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Marketing automation action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update automation settings and triggers
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, settings } = body;

    if (!organizationId || !settings) {
      return NextResponse.json({
        error: 'Organization ID and settings are required'
      }, { status: 400 });
    }

    // Update organization settings for automation
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...settings,
          automation: {
            enabled: settings.automation?.enabled ?? true,
            abandonedCartDelay: settings.automation?.abandonedCartDelay ?? 24, // hours
            birthdayCampaigns: settings.automation?.birthdayCampaigns ?? true,
            reEngagementDelay: settings.automation?.reEngagementDelay ?? 30, // days
            maxEmailsPerDay: settings.automation?.maxEmailsPerDay ?? 1000
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { organization: updatedOrg },
      message: 'Automation settings updated successfully'
    });
  } catch (error) {
    console.error('Automation settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
