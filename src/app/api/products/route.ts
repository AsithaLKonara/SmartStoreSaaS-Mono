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
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { ValidationError } from '@/lib/middleware/withErrorHandler';
import { databaseOptimizer } from '@/lib/database/performance-optimizer';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().nonnegative('Price must be positive'),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  categoryId: z.string().optional()
});

/**
 * GET /api/products
 * List products with organization scoping (supports public access for storefronts)
 */
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const orgIdParam = searchParams.get('organizationId');
    
    // Resolve organization ID with security enforcement
    const user = await getAuthenticatedUser(req);
    let orgId: string | undefined | null = orgIdParam;

    if (user) {
      // For authenticated dashboard users, strictly enforce their organization scope
      const userOrgId = getOrganizationScope(user, orgIdParam || undefined);
      
      // If user is not SUPER_ADMIN, userOrgId will ALWAYS be their own org
      // If user is SUPER_ADMIN, it can be the requested orgId
      orgId = userOrgId;
      
      if (!orgId) {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Insufficient organization access'
        }, { status: 403 });
      }
    } else if (!orgId) {
      // FALLBACK: For public storefront access, resolve from hostname
      const host = req.headers.get('host') || '';
      const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
      const hostname = host.replace(`.${domain}`, '').split(':')[0];
      
      if (hostname && hostname !== domain && hostname !== 'localhost' && hostname !== 'www') {
        const organization = await prisma.organization.findUnique({
          where: { domain: hostname }
        });
        orgId = organization?.id;
      }
    }

    if (!orgId) {
      return NextResponse.json({
        success: false,
        message: 'Organization context required'
      }, { status: 400 });
    }

    // Use optimized query with caching
    const { data } = await databaseOptimizer.getOptimizedProducts(
      orgId,
      page,
      limit,
      search,
      category
    );

    const { products, total } = data;

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
      error: error instanceof Error ? error : new Error(String(error))
    });

    return NextResponse.json({
      success: false,
      code: 'ERR_INTERNAL',
      message: 'Failed to fetch products'
    }, { status: 500 });
  }
};

/**
 * POST /api/products
 * Create new product
 */
export const POST = requirePermission(Permission.PRODUCT_CREATE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const jsonBody = await req.json();
      const parsed = ProductCreateSchema.safeParse(jsonBody);

      if (!parsed.success) {
        throw new ValidationError('Invalid product data: ' + parsed.error.errors.map(e => e.message).join(', '));
      }

      const { name, description, sku, price, cost, stock, minStock, categoryId } = parsed.data;

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
