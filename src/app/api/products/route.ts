import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

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

// GET /api/products - List products with pagination, search, and filters
async function GET(request: NextRequest) {
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

    // Build where clause
    const where: any = {};
    
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

    // Get total count for pagination
    const total = await prisma.product.count({ where });
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Admin/Manager only)
async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
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
      return NextResponse.json(
        { success: false, message: 'SKU already exists in this organization' },
        { status: 409 }
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
      return NextResponse.json(
        { success: false, message: 'Product slug already exists in this organization' },
        { status: 409 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...productData,
        organizationId: request.user!.organizationId,
        createdById: request.user!.userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_CREATED',
        description: `Product "${product.name}" created`,
        userId: request.user!.userId,
        metadata: {
          productId: product.id,
          productName: product.name,
          sku: product.sku
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { product },
      message: 'Product created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Export protected handlers
export const GET = GET;
export const POST = withProtection(['ADMIN', 'MANAGER'])(POST); 