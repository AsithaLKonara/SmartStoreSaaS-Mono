/**
 * Campaign Templates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CAMPAIGNS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CAMPAIGNS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Get organization scoping from session
    const orgId = session.user.organizationId;

    const templates = await prisma.sms_templates.findMany({
      where: orgId ? { organizationId: orgId } : {}, // TODO: Add organizationId filter
      orderBy: { name: 'asc' }
    });

    logger.info({
      message: 'Campaign templates fetched',
      context: { count: templates.length, userId: session.user.id }
    });

    return NextResponse.json(successResponse(templates));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch campaign templates',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, content, type } = body;

    if (!name || !content) {
      return NextResponse.json({ success: false, message: 'Name and content are required' }, { status: 400 });
    }

    // TODO: Get organizationId from session
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    const template = await prisma.sms_templates.create({
      data: {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        name,
        content,
        variables: null,
        isActive: true,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Campaign template created',
      context: { templateId: template.id, userId: session.user.id }
    });

    return NextResponse.json(successResponse(template), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create campaign template',
      error: error.message,
      context: { path: request.nextUrl.pathname, userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
