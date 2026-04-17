import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organization
 * Get current organization details
 */
export const GET = requireAuth(async (req: AuthenticatedRequest, user) => {
  try {
    const organizationId = getOrganizationScope(user);
    
    if (!organizationId) {
      return NextResponse.json({
        success: false,
        message: 'No organization context found'
      }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        message: 'Organization not found'
      }, { status: 404 });
    }

    return NextResponse.json(successResponse(organization));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch organization',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { userId: user.id }
    });
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
});

/**
 * PATCH /api/organization
 * Update current organization details
 */
export const PATCH = requireAuth(async (req: AuthenticatedRequest, user) => {
  try {
    const organizationId = getOrganizationScope(user);
    const body = await req.json();

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        message: 'No organization context found'
      }, { status: 400 });
    }

    // Restriction: Non-SUPER_ADMIN cannot change domain or subscription status
    if (user.role !== 'SUPER_ADMIN') {
      delete body.domain;
      delete body.status;
      delete body.subscriptionPlan;
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Organization updated',
      context: {
        organizationId,
        userId: user.id,
        fields: Object.keys(body)
      }
    });

    return NextResponse.json(successResponse(updated));
  } catch (error: any) {
    logger.error({
      message: 'Failed to update organization',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { userId: user.id }
    });
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
});
