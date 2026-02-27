/**
 * Audit Logs API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_AUDIT_LOGS permission)
 * 
 * Organization Scoping: Optional (SUPER_ADMIN can query all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/audit-logs
 * Get audit logs (SUPER_ADMIN only, can query all organizations)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const organizationId = searchParams.get('organizationId');

      // SUPER_ADMIN can query specific organization or all
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const where: any = { organizationId };

      if (searchParams.get('userId')) {
        where.userId = searchParams.get('userId');
      }
      if (searchParams.get('action')) {
        where.action = searchParams.get('action');
      }
      if (searchParams.get('resource')) {
        where.resource = searchParams.get('resource');
      }
      if (searchParams.get('startDate') || searchParams.get('endDate')) {
        where.createdAt = {};
        if (searchParams.get('startDate')) {
          where.createdAt.gte = new Date(searchParams.get('startDate')!);
        }
        if (searchParams.get('endDate')) {
          where.createdAt.lte = new Date(searchParams.get('endDate')!);
        }
      }

      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

      // Query audit logs
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      logger.info({
        message: 'Audit logs fetched',
        context: {
          userId: user.id,
          organizationId,
          count: logs.length,
          total
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(logs, {
          total,
          limit,
          offset
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch audit logs',
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
        message: 'Failed to fetch audit logs',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
