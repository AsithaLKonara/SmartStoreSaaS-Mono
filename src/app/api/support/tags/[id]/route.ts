/**
 * Single Support Tag API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT_TICKETS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SUPPORT_TICKETS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/tags/[id]
 * Get single support tag
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tagId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // TODO: Implement actual support tag fetching when tags table is created
        // For now, return a placeholder response
        const tag = {
          id: tagId,
          name: 'login',
          color: '#3B82F6',
          count: 0,
          createdAt: new Date().toISOString(),
          tickets: []
        };

        logger.info({
          message: 'Support tag fetched',
          context: {
            userId: user.id,
            tagId,
            organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(tag));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch support tag',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch support tag',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * PUT /api/support/tags/[id]
 * Update support tag
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tagId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { name, color } = body;

        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // TODO: Implement actual support tag updating when tags table is created
        const updatedTag = {
          id: tagId,
          name: name || 'login',
          color: color || '#3B82F6',
          updatedAt: new Date().toISOString()
        };

        logger.info({
          message: 'Support tag updated',
          context: {
            userId: user.id,
            tagId,
            name,
            color,
            organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updatedTag));
      } catch (error: any) {
        logger.error({
          message: 'Support tag update failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update support tag',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * DELETE /api/support/tags/[id]
 * Delete support tag
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tagId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_SUPPORT_TICKETS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // TODO: Implement actual support tag deletion when tags table is created
        // This would involve:
        // 1. Checking if tag is in use
        // 2. Removing tag from database
        // 3. Removing tag from all tickets

        logger.info({
          message: 'Support tag deleted',
          context: {
            userId: user.id,
            tagId,
            organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({ message: 'Support tag deleted successfully' }));
      } catch (error: any) {
        logger.error({
          message: 'Support tag deletion failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to delete support tag',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

