/**
 * Backup Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (EXPORT_BACKUP permission)
 * 
 * System-wide: Export backup files
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/backup/export
 * Export backup file (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { backupId, format = 'sql' } = body;

      // Validation
      if (!backupId) {
        throw new ValidationError('Backup ID is required', {
          fields: { backupId: !backupId }
        });
      }

      logger.info({
        message: 'Backup export initiated',
        context: {
          userId: user.id,
          backupId,
          format
        },
        correlation: req.correlationId
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
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Backup export failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
