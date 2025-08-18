import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Bulk operation template schema
const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['IMPORT', 'EXPORT', 'UPDATE', 'DELETE', 'CUSTOM']),
  entity: z.string().min(1, 'Entity is required'),
  fields: z.array(z.string()).min(1, 'At least one field is required'),
  sampleFile: z.string().optional(),
  validationRules: z.record(z.any()).optional(),
  transformationRules: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/bulk-operations/templates - List bulk operation templates from database
async function getBulkOperationTemplates(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const entity = searchParams.get('entity');
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
    if (entity) where.entity = entity;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Get total count for pagination
    const total = await prisma.bulkOperationTemplate.count({ where });
    
    // Get templates with pagination
    const templates = await prisma.bulkOperationTemplate.findMany({
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
          totalOperations: template.usageCount || 0,
          successfulOperations: 0,
          failedOperations: 0,
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
    console.error('Error fetching bulk operation templates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch bulk operation templates' },
      { status: 500 }
    );
  }
}

// POST /api/bulk-operations/templates - Create new bulk operation template
async function createBulkOperationTemplate(request: NextRequest) {
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
    const existingTemplate = await prisma.bulkOperationTemplate.findFirst({
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
    const template = await prisma.bulkOperationTemplate.create({
      data: {
        ...templateData,
        organizationId: (request as any).user!.organizationId
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'BULK_OPERATION_TEMPLATE_CREATED',
        description: `Bulk operation template "${template.name}" created`,
        userId: (request as any).user!.userId,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          templateType: template.type,
          entity: template.entity
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { template },
      message: 'Bulk operation template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bulk operation template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create bulk operation template' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getBulkOperationTemplates);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createBulkOperationTemplate); 