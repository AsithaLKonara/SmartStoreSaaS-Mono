import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/warehouses/movements - Get inventory movements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {
      organizationId: session.user.organizationId
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryMovement.count({ where })
    ]);

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouses/movements - Create inventory movement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId, warehouseId, type, quantity, reason, notes } = await request.json();

    if (!productId || !warehouseId || !type || !quantity) {
      return NextResponse.json({ message: 'Product ID, warehouse ID, type, and quantity are required' }, { status: 400 });
    }

    // Get product to check current stock
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        organizationId: session.user.organizationId 
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    let newStockQuantity = product.stockQuantity;

    if (type === 'in') {
      newStockQuantity += quantity;
    } else if (type === 'out') {
      if (newStockQuantity < quantity) {
        return NextResponse.json({ message: 'Insufficient stock' }, { status: 400 });
      }
      newStockQuantity -= quantity;
    }

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: newStockQuantity }
    });

    // Create movement record
    const movement = await prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        organizationId: session.user.organizationId,
        type,
        quantity,
        reason,
        notes,
        user: session.user.name || 'System',
      }
    });

    return NextResponse.json(movement, { status: 201 });

  } catch (error) {
    console.error('Error creating movement:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}