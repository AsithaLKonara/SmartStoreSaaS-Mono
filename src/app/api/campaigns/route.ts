export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Campaign creation schema
const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['EMAIL', 'SMS', 'PUSH', 'SOCIAL', 'DISPLAY', 'AFFILIATE']),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  targetAudience: z.object({
    customerSegments: z.array(z.string()).optional(),
    ageRange: z.object({
      min: z.number().min(0, 'Minimum age must be 0 or greater'),
      max: z.number().min(0, 'Maximum age must be 0 or greater')
    }).optional(),
    locations: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional()
  }).optional(),
  channels: z.array(z.string()).min(1, 'At least one channel is required'),
  goals: z.object({
    impressions: z.number().positive('Impressions goal must be positive').optional(),
    clicks: z.number().positive('Clicks goal must be positive').optional(),
    conversions: z.number().positive('Conversions goal must be positive').optional(),
    revenue: z.number().positive('Revenue goal must be positive').optional()
  }).optional(),
  settings: z.record(z.unknown()).optional()
});

// GET /api/campaigns - List campaigns with pagination and filters
async function getCampaigns(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: unknown = {
      organizationId: request.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (type) where.type = type;
    
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Get total count for pagination
    const total = await prisma.campaign.count({ where });
    
    // Get campaigns with pagination
    const campaigns = await prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      // include removed - no metrics relation in schema
    });

    // Metrics calculation removed - metrics not in schema
    const campaignsWithMetrics = campaigns;

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithMetrics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create new campaign
async function createCampaign(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createCampaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const campaignData = validationResult.data;

    // Validate date range
    if (campaignData.endDate && new Date(campaignData.startDate) >= new Date(campaignData.endDate)) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignData.name,
        type: campaignData.type as unknown, // Cast to allow flexibility
        status: campaignData.status as unknown, // Cast to allow flexibility
        settings: campaignData.settings,
        organization: {
          connect: { id: request.user!.organizationId }
        }
      }
    });

    // Campaign metrics creation removed - model doesn't exist

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CAMPAIGN_CREATED',
        description: `Campaign "${campaign.name}" created`,
        user: {
          connect: { id: request.user!.userId }
        },
        metadata: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignType: campaign.type,
          status: campaign.status
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { campaign },
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getCampaigns);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createCampaign); 