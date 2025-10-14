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
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const journalEntryId = params.id;

      const journalEntry = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId }
      });

      if (!journalEntry) {
        throw new ValidationError('Journal entry not found');
      }

      if (journalEntry.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot post journal entries from other organizations');
      }

      if (journalEntry.status === 'POSTED') {
        throw new ValidationError('Journal entry already posted');
      }

      await prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          status: 'POSTED',
          postedBy: user.id,
          postedAt: new Date()
        }
      });

      logger.info({
        message: 'Journal entry posted',
        context: { userId: user.id, journalEntryId }
      });

      return NextResponse.json(successResponse({
        message: 'Journal entry posted successfully',
        journalEntryId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Journal entry posting failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
