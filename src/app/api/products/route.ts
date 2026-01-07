/**
 * Products API Route
 * 
 * Handles product management operations
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PRODUCTS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_PRODUCTS permission)
 * 
 * Organization Scoping:
 * - All roles see only their organization's products
 * - SUPER_ADMIN can query across organizations if orgId provided
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * List products with organization scoping
 */
export const GET = requirePermission('VIEW_PRODUCTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category') || '';
      const skip = (page - 1) * limit;

      // Get organization scoping
      const orgId = getOrganizationScope(user);
      
      // Build where clause
      const where: any = {};
      
      // Add organization filter (CRITICAL: prevents cross-tenant data leaks)
      if (orgId) {
        where.organizationId = orgId;
      }
      
      // Add optional filters
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (category) {
        where.categoryId = category;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            sku: true,
            price: true,
            cost: true,
            stock: true,
            minStock: true,
            categoryId: true,
            organizationId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.product.count({ where })
      ]);

      logger.info({
        message: 'Products fetched',
        context: {
          count: products.length,
          page,
          limit,
          search: search || undefined,
          category: category || undefined,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(products, {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch products',
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
        message: 'Failed to fetch products',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/products
 * Create new product
 */
export const POST = requirePermission('MANAGE_PRODUCTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, description, sku, price, cost, stock, minStock, categoryId } = body;

      // Validation
      if (!name || !sku || price === undefined) {
        throw new ValidationError('Name, SKU, and price are required', {
          fields: { name: !name, sku: !sku, price: price === undefined }
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

      // Create product
      const product = await prisma.product.create({
        data: {
          name,
          description,
          sku,
          price,
          cost,
          stock: stock || 0,
          minStock: minStock || 0,
          categoryId,
          organizationId,
          isActive: true
        }
      });

      logger.info({
        message: 'Product created',
        context: {
          productId: product.id,
          sku: product.sku,
          organizationId: product.organizationId,
          userId: user.id
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
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);
