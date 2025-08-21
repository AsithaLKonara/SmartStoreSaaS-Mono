import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get marketing campaigns with details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (type) where.type = type;

    // Get campaigns with details
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        details: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            details: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.campaign.count({ where });

    // Get campaign statistics
    const stats = await prisma.campaign.groupBy({
      by: ['status', 'type'],
      where: { organizationId },
      _count: { status: true },
    });

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: stats,
    });
  } catch (error) {
    console.error('Marketing campaigns API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new marketing campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      organizationId,
      startDate,
      endDate,
      budget,
      targetAudience,
      campaignDetails,
    } = body;

    if (!organizationId || !name || !type) {
      return NextResponse.json({
        error: 'Organization ID, name, and type are required',
      }, { status: 400 });
    }

    // Create campaign with details in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main campaign
      const campaign = await tx.campaign.create({
        data: {
          name,
          description,
          type,
          organizationId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget: budget || null,
          targetAudience: targetAudience || [],
          status: 'DRAFT',
        },
      });

      // Create campaign details if provided
      if (campaignDetails && campaignDetails.length > 0) {
        for (const detail of campaignDetails) {
          await tx.campaignDetail.create({
            data: {
              campaignId: campaign.id,
              type: detail.type,
              content: detail.content || {},
              targetAudience: detail.targetAudience || {},
              schedule: detail.schedule || {},
              metrics: detail.metrics || {},
            },
          });
        }
      }

      return campaign;
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign status and details
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, status, campaignDetails } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Update campaign in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update main campaign
      const campaign = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: status || undefined,
          updatedAt: new Date(),
        },
      });

      // Update campaign details if provided
      if (campaignDetails) {
        // Delete existing details
        await tx.campaignDetail.deleteMany({
          where: { campaignId },
        });

        // Create new details
        for (const detail of campaignDetails) {
          await tx.campaignDetail.create({
            data: {
              campaignId,
              type: detail.type,
              content: detail.content || {},
              targetAudience: detail.targetAudience || {},
              schedule: detail.schedule || {},
              metrics: detail.metrics || {},
            },
          });
        }
      }

      return campaign;
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Campaign update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
