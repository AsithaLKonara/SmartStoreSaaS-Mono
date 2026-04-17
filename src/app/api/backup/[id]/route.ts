/**
 * Single Backup API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_BACKUPS permission)
 * - DELETE: SUPER_ADMIN only (MANAGE_BACKUPS permission)
 * 
 * System-wide: Backup management
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/backup/[id]
 * Get backup details (SUPER_ADMIN only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const backupId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        logger.info({
          message: 'Backup details fetched',
          context: {
            backupId,
            userId: user.id
          },
          correlation: req.correlationId
        });

        const backupsDir = path.join(process.cwd(), 'backups');
        const filepath = path.join(backupsDir, backupId);

        try {
          const stats = await fs.stat(filepath);
          return NextResponse.json(successResponse({
            id: backupId,
            name: backupId,
            status: 'completed',
            sizeBytes: stats.size,
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
          }));
        } catch {
          throw new NotFoundError(`Backup '${backupId}' not found`);
        }
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch backup details',
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
          message: 'Failed to fetch backup details',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * DELETE /api/backup/[id]
 * Delete backup (SUPER_ADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const backupId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        logger.info({
          message: 'Backup deleted',
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
          await fs.unlink(filepath);
        } catch (e: any) {
          if (e.code === 'ENOENT') {
            throw new NotFoundError(`Backup '${backupId}' not found`);
          }
          throw e;
        }

        return NextResponse.json(successResponse({
          message: 'Backup deleted successfully',
          backupId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Backup deletion failed',
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
          message: 'Backup deletion failed',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}
