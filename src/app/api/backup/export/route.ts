/**
 * Backup Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (EXPORT_BACKUP permission)
 * 
 * System-wide: Export backup files
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { backupId, format = 'sql' } = body;

      logger.info({
        message: 'Backup export initiated',
        context: {
          userId: user.id,
          backupId,
          format
        }
      });

      // TODO: Export actual backup
      return NextResponse.json(successResponse({
        exportUrl: `/backups/export_${backupId}.${format}`,
        backupId,
        format
      }));
    } catch (error: any) {
      logger.error({
        message: 'Backup export failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
