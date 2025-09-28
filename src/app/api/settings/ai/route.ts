import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization settings that contain AI configuration
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Extract AI settings from organization settings
    const aiSettings = organization.settings?.ai || {
      recommendationEngine: {
        limit: 5,
        threshold: 0.7,
        collaborativeFiltering: true,
        contentBasedFiltering: true
      },
      predictiveAnalytics: {
        forecastPeriod: 30,
        confidenceLevel: 0.95,
        demandForecast: true,
        churnPrediction: true
      },
      marketingAutomation: {
        abandonedCart: true,
        birthdayCampaigns: true,
        reEngagement: true
      }
    };

    return NextResponse.json(aiSettings);
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recommendationEngine, predictiveAnalytics, marketingAutomation } = body;

    // Validate AI settings structure
    if (!recommendationEngine || !predictiveAnalytics || !marketingAutomation) {
      return NextResponse.json(
        { error: 'Invalid AI settings structure' },
        { status: 400 }
      );
    }

    // Get current organization settings
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update AI settings within organization settings
    const updatedSettings = {
      ...organization.settings,
      ai: {
        recommendationEngine: {
          limit: Math.max(1, Math.min(20, recommendationEngine.limit || 5)),
          threshold: Math.max(0.1, Math.min(1.0, recommendationEngine.threshold || 0.7)),
          collaborativeFiltering: !!recommendationEngine.collaborativeFiltering,
          contentBasedFiltering: !!recommendationEngine.contentBasedFiltering
        },
        predictiveAnalytics: {
          forecastPeriod: Math.max(7, Math.min(365, predictiveAnalytics.forecastPeriod || 30)),
          confidenceLevel: Math.max(0.5, Math.min(1.0, predictiveAnalytics.confidenceLevel || 0.95)),
          demandForecast: !!predictiveAnalytics.demandForecast,
          churnPrediction: !!predictiveAnalytics.churnPrediction
        },
        marketingAutomation: {
          abandonedCart: !!marketingAutomation.abandonedCart,
          birthdayCampaigns: !!marketingAutomation.birthdayCampaigns,
          reEngagement: !!marketingAutomation.reEngagement
        }
      }
    };

    // Update organization with new AI settings
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { settings: updatedSettings }
    });

    return NextResponse.json({ message: 'AI settings updated successfully' });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
