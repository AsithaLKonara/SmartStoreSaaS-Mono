/**
 * Post Journal Entry API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Validated through journal entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, ValidationError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accounting/journal-entries/[id]/post
 * Post journal entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const journalEntryId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_ACCOUNTING')(
    async (req: AuthenticatedRequest, user) => {
      try {

        const journalEntry = await prisma.journal_entries.findUnique({
          where: { id: journalEntryId }
        });

        if (!journalEntry) {
          throw new NotFoundError('Journal entry not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, journalEntry.organizationId)) {
          throw new AuthorizationError('Cannot post journal entries from other organizations');
        }

        if (journalEntry.status === 'POSTED') {
          throw new ValidationError('Journal entry already posted');
        }

        await prisma.journal_entries.update({
          where: { id: journalEntryId },
          data: {
            status: 'POSTED',
            postedAt: new Date()
          }
        });

        logger.info({
          message: 'Journal entry posted',
          context: {
            userId: user.id,
            journalEntryId,
            organizationId: journalEntry.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Journal entry posted successfully',
          journalEntryId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Journal entry posting failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            journalEntryId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to post journal entry',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}
