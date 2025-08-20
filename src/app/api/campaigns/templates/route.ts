import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Campaign template schema
const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION', 'SOCIAL_MEDIA']),
  content: z.string().min(10, 'Template content must be at least 10 characters'),
  variables: z.array(z.string()).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/campaigns/templates - List campaign templates from database
async function getCampaignTemplates(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: unknown = {
      organizationId: (request as unknown).user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Get total count for pagination
    const total = await prisma.campaignTemplate.count({ where });
    
    // Get templates with pagination
    const templates = await prisma.campaignTemplate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },

    });

    // Calculate template usage statistics
    const templatesWithStats = templates.map(template => {
      return {
        ...template,
        usage: {
          totalCampaigns: template.usageCount || 0,
          activeCampaigns: 0,
          lastUsed: null
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        templates: templatesWithStats,
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
    console.error('Error fetching campaign templates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign templates' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/templates - Create new campaign template
async function createCampaignTemplate(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createTemplateSchema.safeParse(body);
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

    const templateData = validationResult.data;

    // Check if template with same name already exists in the organization
    const existingTemplate = await prisma.campaignTemplate.findFirst({
      where: {
        name: templateData.name,
        organizationId: (request as unknown).user!.organizationId
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template with this name already exists in this organization' },
        { status: 409 }
      );
    }

    // Create template
    const template = await prisma.campaignTemplate.create({
      data: {
        ...templateData,
        organizationId: (request as unknown).user!.organizationId
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CAMPAIGN_TEMPLATE_CREATED',
        description: `Campaign template "${template.name}" created`,
        userId: (request as unknown).user!.userId,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          templateType: template.type
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { template },
      message: 'Campaign template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create campaign template' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getCampaignTemplates);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createCampaignTemplate); 