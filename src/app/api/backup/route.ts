/**
 * Backup Management API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_BACKUPS permission)
 * - POST: SUPER_ADMIN only (MANAGE_BACKUPS permission)
 * 
 * System-wide: Manages database backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * GET /api/backup
 * List backups (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'Backups list requested',
        context: {
          userId: user.id,
          path: req.nextUrl.pathname
        },
        correlation: req.correlationId
      });

      const backupsDir = path.join(process.cwd(), 'backups');
      
      try {
        await fs.access(backupsDir);
      } catch {
        await fs.mkdir(backupsDir, { recursive: true });
      }

      const files = await fs.readdir(backupsDir);
      const backups = await Promise.all(
        files.filter(f => f.endsWith('.sql') || f.endsWith('.tar.gz') || f.endsWith('.zip'))
             .map(async file => {
               const stats = await fs.stat(path.join(backupsDir, file));
               return {
                 id: file,
                 name: file,
                 sizeBytes: stats.size,
                 createdAt: stats.birthtime.toISOString(),
               };
             })
      );

      return NextResponse.json(successResponse({
        backups: backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        total: backups.length,
        message: 'Backup list retrieved successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to list backups',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to list backups',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/backup
 * Create backup (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { type = 'full', description } = body;

      logger.info({
        message: 'Backup creation triggered',
        context: {
          userId: user.id,
          type,
          description
        },
        correlation: req.correlationId
      });

      const backupId = `backup_${Date.now()}`;
      const filename = `${backupId}.sql`;
      const backupsDir = path.join(process.cwd(), 'backups');
      
      try {
        await fs.access(backupsDir);
      } catch {
        await fs.mkdir(backupsDir, { recursive: true });
      }

      const filepath = path.join(backupsDir, filename);
      const dbUrl = process.env.DATABASE_URL;

      // Make the actual backup non-blocking from the response
      if (dbUrl) {
        execAsync(`pg_dump "${dbUrl}" -f "${filepath}"`).then(() => {
          logger.info({ message: 'Backup created successfully', backupId, filepath });
        }).catch((err) => {
          logger.error({ message: 'Backup creation async failed', error: err, backupId });
        });
      } else {
        logger.warn({ message: 'DATABASE_URL not found, skipping pg_dump for backup mock' });
        await fs.writeFile(filepath, '-- Mock Backup File\n'); // Fallback if no DB URL
      }

      return NextResponse.json(successResponse({
        backupId,
        type,
        status: 'pending',
        message: 'Backup creation initiated'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Backup creation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Backup creation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);