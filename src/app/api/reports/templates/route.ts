import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Report template schema
const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['SALES', 'INVENTORY', 'CUSTOMER', 'FINANCIAL', 'OPERATIONAL', 'CUSTOM']),
  category: z.string().min(1, 'Category is required'),
  isCustomizable: z.boolean().default(true),
  parameters: z.array(z.string()).optional(),
  defaultFilters: z.record(z.any()).optional(),
  visualizationTypes: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional()
});

// GET /api/reports/templates - List report templates from database
async function getReportTemplates(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      organizationId: (request as any).user!.organizationId
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
    const total = await prisma.reportTemplate.count({ where });
    
    // Get templates with pagination
    const templates = await prisma.reportTemplate.findMany({
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
          totalReports: template.usageCount || 0,
          completedReports: 0,
          failedReports: 0,
          successRate: 0,
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
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch report templates' },
      { status: 500 }
    );
  }
}

// POST /api/reports/templates - Create new report template
async function createReportTemplate(request: NextRequest) {
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
    const existingTemplate = await prisma.reportTemplate.findFirst({
      where: {
        name: templateData.name,
        organizationId: (request as any).user!.organizationId
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template with this name already exists in this organization' },
        { status: 409 }
      );
    }

    // Create template
    const template = await prisma.reportTemplate.create({
      data: {
        ...templateData,
        organizationId: (request as any).user!.organizationId
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'REPORT_TEMPLATE_CREATED',
        description: `Report template "${template.name}" created`,
        userId: (request as any).user!.userId,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          templateType: template.type,

        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { template },
      message: 'Report template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create report template' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getReportTemplates);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createReportTemplate); 