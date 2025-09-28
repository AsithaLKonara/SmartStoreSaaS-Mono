import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get products list (paginated)
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const categoryIdParam = searchParams.get('categoryId') || '';
        const isActive = searchParams.get('isActive') || 'true';

        const where: any = {
          organizationId: user.organizationId,
          isActive: isActive === 'true',
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (categoryIdParam) {
          where.categoryId = categoryIdParam;
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              variants: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.product.count({ where }),
        ]);

        return NextResponse.json({
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });

      case 'POST':
        // Create new product
        const body = await request.json();
        const { 
          name, 
          description, 
          sku, 
          price, 
          cost, 
          stock, 
          minStock, 
          weight, 
          dimensions, 
          tags, 
          categoryId: productCategoryId,
          variants 
        } = body;

        // Validate required fields
        if (!name || !sku || price === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: name, sku, price' },
            { status: 400 }
          );
        }

        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku },
        });

        if (existingProduct) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 409 }
          );
        }

        // Create product
        const newProduct = await prisma.product.create({
          data: {
            name,
            description: description || null,
            sku,
            price: parseFloat(price),
            cost: cost ? parseFloat(cost) : null,
            stock: parseInt(stock) || 0,
            minStock: parseInt(minStock) || 0,
            weight: weight ? parseFloat(weight) : null,
            dimensions: dimensions ? JSON.stringify(dimensions) : null,
            tags: tags ? JSON.stringify(tags) : null,
            categoryId: productCategoryId || null,
            organizationId: user.organizationId,
            isActive: true,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Create variants if provided
        if (variants && variants.length > 0) {
          for (const variant of variants) {
            await prisma.productVariant.create({
              data: {
                name: variant.name,
                sku: variant.sku,
                price: parseFloat(variant.price),
                cost: variant.cost ? parseFloat(variant.cost) : null,
                stock: parseInt(variant.stock) || 0,
                weight: variant.weight ? parseFloat(variant.weight) : null,
                dimensions: variant.dimensions ? JSON.stringify(variant.dimensions) : null,
                productId: newProduct.id,
                organizationId: user.organizationId,
                isActive: true,
              },
            });
          }
        }

        return NextResponse.json(
          {
            message: 'Product created successfully',
            product: newProduct,
          },
          { status: 201 }
        );

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_WRITE],
});