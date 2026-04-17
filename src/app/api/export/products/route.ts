/**
 * Product Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (EXPORT_PRODUCTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/export/products
 * Export products (VIEW_PRODUCTS permission)
 */
export const POST = requirePermission(Permission.PRODUCT_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { format = 'csv', filters } = body;

      logger.info({
        message: 'Product export requested',
        context: {
          userId: user.id,
          organizationId,
          format
        },
        correlation: req.correlationId
      });

      const products = await prisma.product.findMany({
        where: { organizationId },
        include: { _count: { select: { orderItems: true } } }
      });

      let exportData = '';
      if (format === 'csv') {
        const header = ['ID', 'Name', 'SKU', 'Price', 'Inventory Count', 'Orders Count'].join(',');
        const rows = products.map(p => [
          p.id, p.name, p.sku || '', p.price, p.inventoryCount, p._count.orderItems
        ].map(col => `"${String(col).replace(/"/g, '""')}"`).join(','));
        exportData = [header, ...rows].join('\n');
      } else {
        exportData = JSON.stringify(products, null, 2);
      }

      return NextResponse.json(successResponse({
        exportUrl: null,
        data: exportData,
        format,
        recordCount: products.length,
        message: 'Product export completed'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Product export failed',
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
        message: 'Product export failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
