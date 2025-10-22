import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;

    // Query SMS campaigns from database
    const [campaigns, total] = await Promise.all([
      prisma.sms_campaigns.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sms_templates: {
            select: { name: true, message: true }
          }
        }
      }),
      prisma.sms_campaigns.count({ where })
    ]);

    logger.info({
      message: 'Marketing campaigns fetched successfully',
      context: {
        userId: session.user.id,
        organizationId,
        count: campaigns.length,
        total,
        status,
        type,
        page,
        limit
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch marketing campaigns',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch marketing campaigns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, subject, content, recipientList, scheduledAt, templateId } = body;

    // Validate required fields
    if (!name || !type || !subject || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, type, subject, content'
      }, { status: 400 });
    }

    logger.info({
      message: 'Marketing campaign created',
      context: {
        userId: session.user.id,
        name,
        type,
        recipientCount: recipientList?.length || 0
      }
    });

    // TODO: Implement actual campaign creation logic
    // This would typically involve:
    // 1. Validating campaign data
    // 2. Creating campaign record in database
    // 3. Scheduling campaign if scheduledAt is provided
    // 4. Setting up tracking and analytics

    const campaign = {
      id: `campaign_${Date.now()}`,
      name,
      type,
      subject,
      content,
      recipientList: recipientList || [],
      scheduledAt: scheduledAt || null,
      templateId: templateId || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Marketing campaign created successfully',
      data: campaign
    }, { status: 201 });

  } catch (error: any) {
    logger.error({
      message: 'Failed to create marketing campaign',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create marketing campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}