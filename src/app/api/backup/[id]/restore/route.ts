/**
 * Restore Specific Backup API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_BACKUPS permission)
 * 
 * System-wide: Restore from specific backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * POST /api/backup/[id]/restore
 * Restore from specific backup (SUPER_ADMIN only)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const backupId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        logger.info({
          message: 'Backup restore initiated',
          context: {
            backupId,
            userId: user.id
          },
          correlation: req.correlationId
        });

        const backupsDir = path.join(process.cwd(), 'backups');
        const filepath = path.join(backupsDir, backupId);

        try {
          await fs.access(filepath);
        } catch {
          throw new NotFoundError(`Backup '${backupId}' not found`);
        }

        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
          execAsync(`psql "${dbUrl}" -f "${filepath}"`).then(() => {
            logger.info({ message: 'Backup restore completed', backupId });
          }).catch((err) => {
            logger.error({ message: 'Backup restore async failed', error: err, backupId });
          });
        } else {
          logger.warn({ message: 'DATABASE_URL not set, skipping actual restore' });
        }

        return NextResponse.json(successResponse({
          backupId,
          status: 'in_progress',
          message: 'Restore initiated - the process will complete in the background'
        }));
      } catch (error: any) {
        logger.error({
          message: 'Backup restore failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            backupId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Backup restore failed',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}
