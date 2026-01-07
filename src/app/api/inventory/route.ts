import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Build where clause for search
    const where: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as any } },
        { sku: { contains: search, mode: 'insensitive' as any } },
        { barcode: { contains: search, mode: 'insensitive' as any } }
      ]
    } : {};

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
      message: 'Inventory fetched successfully',
      context: {
        userId: session.user.id,
        count: inventory.length,
        total,
        page,
        limit
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        inventory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch inventory',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, cost, sku, barcode, categoryId, stockQuantity, minStockLevel, maxStockLevel } = body;

    // Validate required fields
    if (!name || !price || !sku) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, price, sku'
      }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    // Create new product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : 0,
        sku,
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
      message: 'Product created successfully',
      context: {
        userId: session.user.id,
        productId: product.id,
        productName: product.name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product
    }, { status: 201 });

  } catch (error: any) {
    logger.error({
      message: 'Failed to create product',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create product',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}