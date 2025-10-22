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

    const organizationId = session.user.organizationId;

    // Define standard support tags (can be enhanced with DB table)
    const standardTags = [
      { id: 'tag_login', name: 'login', color: '#3B82F6' },
      { id: 'tag_billing', name: 'billing', color: '#10B981' },
      { id: 'tag_technical', name: 'technical', color: '#F59E0B' },
      { id: 'tag_feature', name: 'feature-request', color: '#8B5CF6' },
      { id: 'tag_bug', name: 'bug', color: '#EF4444' },
      { id: 'tag_urgent', name: 'urgent', color: '#DC2626' }
    ];

    // Get actual counts from support tickets (using title/description contains)
    const tagsWithCounts = await Promise.all(
      standardTags.map(async (tag) => {
        const count = await prisma.support_tickets.count({
          where: {
            organizationId,
            OR: [
              { title: { contains: tag.name, mode: 'insensitive' } },
              { description: { contains: tag.name, mode: 'insensitive' } }
            ]
          }
        });
        return { ...tag, count };
      })
    );

    logger.info({
      message: 'Support tags fetched',
      context: {
        userId: session.user.id,
        organizationId,
        count: tagsWithCounts.length
      }
    });

    return NextResponse.json({
      success: true,
      data: tagsWithCounts
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch support tags',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support tags',
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

    const body = await request.json();
    const { name, color } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Tag name is required'
      }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Create tag record (using activities for now, can create dedicated tags table)
    await prisma.activities.create({
      data: {
        userId: session.user.id,
        organizationId,
        type: 'TAG_CREATED',
        description: `Support tag '${name}' created`,
        metadata: { tagName: name, color: color || '#6B7280' }
      }
    });

    const tag = {
      id: `tag_${Date.now()}`,
      name,
      color: color || '#6B7280',
      count: 0,
      createdAt: new Date().toISOString()
    };

    logger.info({
      message: 'Support tag created',
      context: {
        userId: session.user.id,
        organizationId,
        name,
        color
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Support tag created successfully',
      data: tag
    });

  } catch (error: any) {
    logger.error({
      message: 'Support tag creation failed',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Support tag creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

