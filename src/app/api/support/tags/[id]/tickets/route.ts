/**
 * Support Tag Tickets API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPORT_TICKETS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/tags/[id]/tickets
 * Get tickets for a specific tag
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
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        // TODO: Implement actual support tag tickets fetching when tag-ticket relationship is implemented
        // This would involve querying tickets with this tag from database
        const tickets: any[] = [];
        const total = 0;

        logger.info({
          message: 'Support tag tickets fetched',
          context: {
            userId: user.id,
            tagId,
            page,
            limit,
            organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(
          successResponse(tickets, {
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          })
        );
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch support tag tickets',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            tagId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch support tag tickets',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}