import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { withErrorHandling } from '@/lib/error-handling';
// import { cache, cacheKeys, invalidateCache } from '@/lib/cache'; // Temporarily disabled for build
import { withSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';
import { DatabaseOptimizer } from '@/lib/database-optimization';
import { productCreateSchema, productUpdateSchema, productQuerySchema, validateRequestBody, validateQueryParams, createValidationErrorResponse } from '@/lib/validation/schemas';
// import { addTenantFilter, ensureTenantOwnership } from '@/lib/tenant/isolation'; // Temporarily disabled for stability

// Helper function to fetch products
async function getProducts(request: NextRequest) {
  try {
    // Simplified query params (no validation for now)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    // Cache temporarily disabled for stability
    // const cacheKey = cacheKeys.products(page, limit, JSON.stringify({ search, category, sortBy, sortOrder }));
    // const cached = await cache.get(cacheKey);
    // if (cached) {
    //   return NextResponse.json(cached);
    // }

    // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  // Build orderBy clause
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  // Fetch products using connection pool with optimized query
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        cost: true,
        categoryId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // Removed _count to improve performance
      }
    }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

    const response = {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Products fetched successfully'
    };

    // Cache temporarily disabled
    // await cache.set(cacheKey, response, 300);

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message.includes('Validation failed')) {
      const errors = JSON.parse(error.message.replace('Validation failed: ', ''));
      return createValidationErrorResponse(errors);
    }
    throw error;
  }
}

// GET /api/products - Fetch all products with pagination and filtering
export const GET = withErrorHandling(getProducts);

// POST /api/products - Create a new product
export const POST = withErrorHandling(
  withSecurity({
    rateLimit: { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
    cors: true,
    headers: true
  })(async (request: NextRequest) => {
    try {
      const validatedData = await validateRequestBody(request, productCreateSchema);
      const { name, description, sku, price, cost, categoryId, isActive = true } = validatedData;

  // Create product using connection pool
  const product = await prisma.product.create({
    data: {
      id: `product-${Date.now()}`,
      name,
      description: description || null,
      sku,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : null,
      stock: 0,
      minStock: 0,
      weight: null,
      dimensions: null,
      tags: null,
      isVariant: false,
      parentProductId: null,
      categoryId: categoryId || null,
      isActive,
      organizationId: 'seed-org-1-1759434570099'
    }
  });

      // Invalidate product caches
      await invalidateCache.product(product.id);

      return NextResponse.json({
        success: true,
        data: product,
        message: 'Product created successfully'
      }, { status: 201 });
    } catch (error: any) {
      if (error.message.includes('Validation failed')) {
        const errors = JSON.parse(error.message.replace('Validation failed: ', ''));
        return createValidationErrorResponse(errors);
      }
      throw error;
    }
  })
);

// PUT /api/products - Update an existing product
export const PUT = withErrorHandling(
  withSecurity({
    rateLimit: { windowMs: 60000, maxRequests: 20 },
    // validation removed - handled in function
    cors: true,
    headers: true
  })(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;
      
      // Validate the update data
      const validatedData = productUpdateSchema.parse(updateData);

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Product ID is required'
    }, { status: 400 });
  }

      // Update product using connection pool
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        }
      });

      // Invalidate product caches
      await invalidateCache.product(product.id);

      return NextResponse.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Validation failed')) {
        const errors = JSON.parse(error.message.replace('Validation failed: ', ''));
        return createValidationErrorResponse(errors);
      }
      throw error;
    }
  })
);

// DELETE /api/products - Delete a product
export const DELETE = withErrorHandling(
  withSecurity({
    rateLimit: { windowMs: 60000, maxRequests: 10 },
    // validation removed - handled in function
    cors: true,
    headers: true
  })(async (request: NextRequest) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Product ID is required'
    }, { status: 400 });
  }

  // Delete product using connection pool
  await prisma.product.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true,
    message: 'Product deleted successfully'
  });
  })
);
