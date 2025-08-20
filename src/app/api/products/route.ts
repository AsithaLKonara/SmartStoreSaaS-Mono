import { AuthenticatedRequest, withProtection } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { 
  CommonErrors,
  generateRequestId,
  getRequestPath
} from '@/lib/error-handling';
import { withCache, cacheKeys, invalidateProductCache } from '@/lib/cache';

// Product creation schema
const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  slug: z.string().min(2, 'Product slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  isActive: z.boolean().optional().default(true),
});

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// GET /api/products - Get all products for the organization
async function getProducts(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const minStock = searchParams.get('minStock');
    const maxStock = searchParams.get('maxStock');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isActive = searchParams.get('isActive');

    // Build where clause with organization filter
    const where: Prisma.ProductWhereInput = {
      organizationId: request.user!.organizationId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minStock !== null) where.stockQuantity = { gte: parseInt(minStock) };
    if (maxStock !== null) where.stockQuantity = { ...where.stockQuantity, lte: parseInt(maxStock) };
    if (minPrice !== null) where.price = { gte: parseFloat(minPrice) };
    if (maxPrice !== null) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (isActive !== null) where.isActive = isActive === 'true';

    // Create cache key based on filters
    const filtersString = JSON.stringify({ search, minStock, maxStock, minPrice, maxPrice, isActive });
    const cacheKey = cacheKeys.productList(page, limit, filtersString);

    // Use read-through cache
    const result = await withCache(
      cacheKey,
      300, // 5 minutes TTL
      async () => {
        // Get total count for pagination
        const total = await prisma.product.count({ where });
        
        // Get products with pagination
        const products = await prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        };
      }
    );

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(result, 200, origin);

  } catch (error) {
    console.error('Error fetching products:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database query error',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// POST /api/products - Create new product (Admin/Manager only)
async function createProduct(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.VALIDATION_ERROR(
        validationResult.error.errors,
        path,
        requestId
      );
    }

    const productData = validationResult.data;

    // Check if SKU already exists in the organization
    const existingSku = await prisma.product.findFirst({
      where: {
        sku: productData.sku,
        organizationId: request.user!.organizationId
      }
    });

    if (existingSku) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.CONFLICT(
        'SKU already exists in this organization',
        path,
        requestId
      );
    }

    // Check if slug already exists in the organization
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug: productData.slug,
        organizationId: request.user!.organizationId
      }
    });

    if (existingSlug) {
      const path = getRequestPath(request);
      const requestId = generateRequestId();
      
      return CommonErrors.CONFLICT(
        'Product slug already exists in this organization',
        path,
        requestId
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...productData,
        organizationId: request.user!.organizationId,
        createdById: request.user!.userId
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_CREATED',
        description: `Product "${product.name}" created`,
        user: {
          connect: { id: request.user!.userId }
        },
        metadata: {
          productId: product.id,
          productName: product.name,
          sku: product.sku || null
        }
      }
    });

    // Invalidate related cache
    await invalidateProductCache(product.id, request.user!.organizationId);

    const responseData = { product };

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(responseData, 201, origin);

  } catch (error) {
    console.error('Error creating product:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return CommonErrors.BAD_REQUEST(
        'Database operation failed',
        { code: error.code, meta: error.meta },
        path,
        requestId
      );
    }
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// Export protected handlers with security middleware
export const GET = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  getProducts
);

export const POST = withProtection(['ADMIN', 'MANAGER'], 100)(
  createProduct
); 