/**
 * Support Tags API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT_TICKETS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/tags
 * List support tags
 */
export const GET = requirePermission('VIEW_SUPPORT_TICKETS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

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
          userId: user.id,
          organizationId,
          count: tagsWithCounts.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(tagsWithCounts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch support tags',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch support tags',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/support/tags
 * Create support tag
 */
export const POST = requirePermission('MANAGE_SUPPORT_TICKETS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, color } = body;

      // Validate required fields
      if (!name) {
        throw new ValidationError('Tag name is required');
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

    // Create tag record (using activities for now, can create dedicated tags table)
    await prisma.activities.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        organizationId,
        type: 'TAG_CREATED',
        description: `Support tag '${name}' created`,
        metadata: JSON.stringify({ tagName: name, color: color || '#6B7280' })
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
          userId: user.id,
          organizationId,
          name,
          color
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(tag));
    } catch (error: any) {
      logger.error({
        message: 'Support tag creation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create support tag',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

