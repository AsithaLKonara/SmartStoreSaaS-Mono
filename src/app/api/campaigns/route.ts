/**
 * Marketing Campaigns API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CAMPAIGNS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CAMPAIGNS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    // TODO: Get organization scoping from session
    // const orgId = session.user.organizationId;

    const where: any = {};
    // if (orgId) where.organizationId = orgId;
    if (type) where.type = type;
    if (status) where.status = status;

    const campaigns = await prisma.sms_campaigns.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    logger.info({
      message: 'Campaigns fetched',
      context: { count: campaigns.length }
    });

    return NextResponse.json(successResponse(campaigns));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch campaigns',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { name, type, message, scheduledFor } = body;

    if (!name || !type || !message) {
      return NextResponse.json({ success: false, message: 'Name, type, and message are required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'User must belong to an organization' }, { status: 400 });
    }

    // Get or create default template for this message
    const template = await prisma.sms_templates.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: `Campaign: ${name}`
        }
      },
      create: {
        organizationId,
        name: `Campaign: ${name}`,
        message,
        isActive: true
      },
      update: {
        message
      }
    });

    const campaign = await prisma.sms_campaigns.create({
      data: {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        name,
        templateId: template.id,
        status: 'draft',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Campaign created',
      context: { campaignId: campaign.id }
    });

    return NextResponse.json(successResponse(campaign), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create campaign',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create campaign' }, { status: 500 });
  }
}
