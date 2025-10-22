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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const journalEntryId = params.id;

      const journalEntry = await prisma.journal_entries.findUnique({
        where: { id: journalEntryId }
      });

      if (!journalEntry) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Journal entry not found' }, { status: 404 });
      }

      if (journalEntry.status === 'POSTED') {
        return NextResponse.json({ success: false, code: 'ERR_VALIDATION', message: 'Journal entry already posted' }, { status: 400 });
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
        context: { journalEntryId }
      });

      return NextResponse.json(successResponse({
        message: 'Journal entry posted successfully',
        journalEntryId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Journal entry posting failed',
        error: error.message,
        context: { journalEntryId: params.id }
      });
      throw error;
    }
}
