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
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

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

      // Get organization scoping
      const orgId = getOrganizationScope(user);
      
      // Build where clause
      const where: any = {};
      
      // Add organization filter (CRITICAL: prevents cross-tenant data leaks)
      if (orgId) {
        where.organizationId = orgId;
      }
      
      // Add search filters
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get inventory items with pagination
      const [inventory, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);

      logger.info({
        message: 'Inventory fetched',
        context: {
          userId: user.id,
          count: inventory.length,
          total,
          page,
          limit,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(inventory, {
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch inventory',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
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
      const { name, description, price, cost, sku, barcode, categoryId, stockQuantity, minStockLevel, maxStockLevel } = body;

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

      // Check for duplicate SKU within organization
      const existing = await prisma.product.findFirst({
        where: {
          sku,
          organizationId
        }
      });

      if (existing) {
        throw new ValidationError('Product with this SKU already exists', {
          field: 'sku',
          value: sku
        });
      }

      // Create new product
      const product = await prisma.product.create({
        data: {
          name,
          description: description || '',
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : 0,
          sku,
          barcode: barcode || null,
          stock: stockQuantity ? parseInt(stockQuantity) : 0,
          minStock: minStockLevel ? parseInt(minStockLevel) : 0,
          categoryId: categoryId || null,
          isActive: true,
          organizationId
        },
        include: {
          category: true
        }
      });

      logger.info({
        message: 'Product created',
        context: {
          userId: user.id,
          productId: product.id,
          productName: product.name,
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
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      // Re-throw ValidationError to be handled by middleware
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