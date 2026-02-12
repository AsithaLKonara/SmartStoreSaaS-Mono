/**
 * Inventory Reports API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_REPORTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/inventory
 * Generate inventory report
 */
export const POST = requirePermission('VIEW_REPORTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { reportType, category } = body; // Optional filtering

      // Filter by category if provided
      const where: any = { organizationId };
      if (category) {
        where.categoryId = category;
      }

      // Fetch products
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          price: true,
          categoryId: true,
          updatedAt: true
        }
      });

      // Calculate totals
      const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.price)), 0);

      logger.info({
        message: 'Inventory report generated',
        context: {
          userId: user.id,
          organizationId,
          productCount: products.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        reportType: reportType || 'current_stock',
        generatedAt: new Date().toISOString(),
        summary: {
          totalProducts: products.length,
          totalStockItems: totalItems,
          totalInventoryValue: totalValue
        },
        data: products
      }));
    } catch (error: any) {
      logger.error({
        message: 'Inventory report generation failed',
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
        message: 'Inventory report generation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
