import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get products with variants and media
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const includeVariants = searchParams.get('includeVariants') === 'true';
    const includeMedia = searchParams.get('includeMedia') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
      isVariant: false, // Only get parent products
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get products with optional relations
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: includeVariants ? {
          include: {
            productVariants: true,
          },
        } : false,
        media: includeMedia ? {
          orderBy: { sortOrder: 'asc' },
        } : false,
        _count: {
          select: {
            variants: true,
            media: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Advanced products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create product with variants and media
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      price,
      comparePrice,
      cost,
      organizationId,
      categoryId,
      status,
      inventoryQuantity,
      weight,
      dimensions,
      tags,
      variants,
      media,
    } = body;

    if (!organizationId || !name || !price) {
      return NextResponse.json({
        error: 'Organization ID, name, and price are required',
      }, { status: 400 });
    }

    // Create product with variants and media in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main product
      const product = await tx.product.create({
        data: {
          name,
          description,
          sku,
          price,
          comparePrice,
          cost,
          organizationId,
          categoryId,
          status: status || 'DRAFT',
          inventoryQuantity: inventoryQuantity || 0,
          weight,
          dimensions,
          tags: tags || [],
          createdById: session.user.id,
          updatedById: session.user.id,
        },
      });

      // Create variants if provided
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          await tx.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              value: variant.value,
              sku: variant.sku,
              price: variant.price || price,
              comparePrice: variant.comparePrice || comparePrice,
              cost: variant.cost || cost,
              inventoryQuantity: variant.inventoryQuantity || 0,
              weight: variant.weight || weight,
              dimensions: variant.dimensions || dimensions,
              sortOrder: variant.sortOrder || 0,
            },
          });
        }
      }

      // Create media if provided
      if (media && media.length > 0) {
        for (const mediaItem of media) {
          await tx.productMedia.create({
            data: {
              productId: product.id,
              type: mediaItem.type || 'IMAGE',
              url: mediaItem.url,
              altText: mediaItem.altText,
              sortOrder: mediaItem.sortOrder || 0,
              isPrimary: mediaItem.isPrimary || false,
              metadata: mediaItem.metadata || {},
            },
          });
        }
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product with variants and media
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, ...updateData } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Update product in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update main product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          ...updateData,
          updatedById: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Update variants if provided
      if (updateData.variants) {
        // Delete existing variants
        await tx.productVariant.deleteMany({
          where: { productId },
        });

        // Create new variants
        for (const variant of updateData.variants) {
          await tx.productVariant.create({
            data: {
              productId,
              name: variant.name,
              value: variant.value,
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice,
              cost: variant.cost,
              inventoryQuantity: variant.inventoryQuantity || 0,
              weight: variant.weight,
              dimensions: variant.dimensions,
              sortOrder: variant.sortOrder || 0,
            },
          });
        }
      }

      // Update media if provided
      if (updateData.media) {
        // Delete existing media
        await tx.productMedia.deleteMany({
          where: { productId },
        });

        // Create new media
        for (const mediaItem of updateData.media) {
          await tx.productMedia.create({
            data: {
              productId,
              type: mediaItem.type || 'IMAGE',
              url: mediaItem.url,
              altText: mediaItem.altText,
              sortOrder: mediaItem.sortOrder || 0,
              isPrimary: mediaItem.isPrimary || false,
              metadata: mediaItem.metadata || {},
            },
          });
        }
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
