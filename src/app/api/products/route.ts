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
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * List products with organization scoping
 */
export const GET = requirePermission('VIEW_PRODUCTS')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category') || '';
      const skip = (page - 1) * limit;

      // Organization scoping (critical for multi-tenant isolation)
      const orgId = getOrganizationScope(user, searchParams.get('organizationId') || undefined);
      
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
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
          count: products.length,
          page,
          limit,
          search: search || undefined,
          category: category || undefined
        }
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
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

/**
 * POST /api/products
 * Create new product
 */
export const POST = requirePermission('MANAGE_PRODUCTS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, description, sku, price, cost, stock, minStock, categoryId } = body;

      // Validation
      if (!name || !sku || price === undefined) {
        throw new ValidationError('Name, SKU, and price are required', {
          fields: { name: !name, sku: !sku, price: price === undefined }
        });
      }

      // Organization scoping (CRITICAL: prevent cross-tenant data creation)
      const organizationId = user.organizationId;
      
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
          organizationId, // CRITICAL: ensure product belongs to user's org
          isActive: true
        }
      });

      logger.info({
        message: 'Product created',
        context: {
          createdBy: user.id,
          productId: product.id,
          sku: product.sku,
          organizationId: product.organizationId
        }
      });

      return NextResponse.json(
        successResponse(product),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create product',
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);
