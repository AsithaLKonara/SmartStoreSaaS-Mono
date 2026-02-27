/**
 * Inventory API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { InventoryService } from '@/lib/services/inventory.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory
 * List inventory items with organization scoping
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const orgId = getOrganizationScope(user);

      if (!orgId) {
        return NextResponse.json({
          success: false,
          message: 'Organization ID required'
        }, { status: 400 });
      }

      const result = await InventoryService.getInventory({
        organizationId: orgId,
        page,
        limit,
        search
      });

      logger.info({
        message: 'Inventory fetched via Service',
        context: {
          userId: user.id,
          count: result.products.length,
          total: result.total,
          page,
          limit,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(result.products, {
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: result.totalPages
          }
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch inventory',
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
        message: 'Failed to fetch inventory',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/inventory
 * Create new inventory item with organization scoping
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, description, price, cost, sku, categoryId, stockQuantity, minStockLevel } = body;

      // Validation
      if (!name || !price || !sku) {
        throw new ValidationError('Missing required fields: name, price, sku', {
          fields: { name: !name, price: !price, sku: !sku }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Check for duplicate SKU within organization (optional - service can also handle)
      const existing = await prisma.product.findFirst({
        where: { sku, organizationId }
      });

      if (existing) {
        throw new ValidationError('Product with this SKU already exists', {
          field: 'sku',
          value: sku
        });
      }

      // Business logic delegated to service
      const product = await InventoryService.createProduct({
        name,
        sku,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : 0,
        stock: stockQuantity ? parseInt(stockQuantity) : 0,
        minStock: minStockLevel ? parseInt(minStockLevel) : 0,
        categoryId,
        organizationId,
        description,
        createdById: user.id
      });

      logger.info({
        message: 'Product created via Service',
        context: {
          userId: user.id,
          productId: product.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(product),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create product',
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
        message: 'Failed to create product',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);