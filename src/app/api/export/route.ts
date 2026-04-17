import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/export
 * Export data (authenticated users, permission may vary by type)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const body = await req.json();
      const { type, format } = body;

      if (!type) {
        throw new ValidationError('Export type is required', {
          fields: { type: !type }
        });
      }

      logger.info({
        message: 'Data export requested',
        context: {
          userId: user.id,
          organizationId,
          type,
          format
        },
        correlation: req.correlationId
      });

      let data: any[] = [];
      let header: string[] = [];
      let rows: string[] = [];

      if (type === 'customers') {
        const customers = await prisma.customer.findMany({
          where: { organizationId: organizationId! }
        });
        header = ['ID', 'Name', 'Email', 'Phone', 'Created At'];
        rows = customers.map(c => [
          c.id, `${c.firstName} ${c.lastName}`, c.email || '', c.phone || '', c.createdAt.toISOString()
        ].map(col => `"${String(col).replace(/"/g, '""')}"`).join(','));
        data = customers;
      } else if (type === 'orders') {
        const orders = await prisma.order.findMany({
          where: { organizationId: organizationId! }
        });
        header = ['ID', 'Customer ID', 'Total', 'Status', 'Created At'];
        rows = orders.map(o => [
          o.id, o.customerId, o.total, o.status, o.createdAt.toISOString()
        ].map(col => `"${String(col).replace(/"/g, '""')}"`).join(','));
        data = orders;
      } else {
        throw new ValidationError(`Unsupported export type: ${type}`);
      }

      let exportData = '';
      if (format === 'csv') {
        exportData = [header.join(','), ...rows].join('\n');
      } else {
        exportData = JSON.stringify(data, null, 2);
      }

      return NextResponse.json(successResponse({
        message: 'Export completed',
        data: exportData,
        format,
        recordCount: data.length
      }));
    } catch (error: any) {
      logger.error({
        message: 'Export failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Export failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);