/**
 * Restore Backup API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_BACKUPS permission)
 * 
 * System-wide: Restores database from backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * POST /api/backup/restore
 * Restore database from backup (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { backupId } = body;

      // Validation
      if (!backupId) {
        throw new ValidationError('Backup ID is required', {
          fields: { backupId: !backupId }
        });
      }

      logger.info({
        message: 'Backup restore initiated',
        context: {
          userId: user.id,
          backupId
        },
        correlation: req.correlationId
      });

      const backupsDir = path.join(process.cwd(), 'backups');
      const filepath = path.join(backupsDir, backupId);

      // Verify file exists
      try {
        await fs.access(filepath);
      } catch {
        throw new NotFoundError(`Backup '${backupId}' not found`);
      }

      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        // Run restore non-blocking
        execAsync(`psql "${dbUrl}" -f "${filepath}"`).then(() => {
          logger.info({ message: 'Backup restore completed', backupId });
        }).catch((err) => {
          logger.error({ message: 'Backup restore async failed', error: err, backupId });
        });
      } else {
        logger.warn({ message: 'DATABASE_URL not found, skipping actual restore' });
      }

      return NextResponse.json(successResponse({
        status: 'in_progress',
        backupId,
        message: 'Restore initiated - the process will complete in the background'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Backup restore failed',
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
        message: 'Backup restore failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
