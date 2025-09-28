import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/warehouses/inventory - Get inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const where: any = {
      organizationId: session.user.organizationId
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [inventory, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              image: true
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
          updatedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return NextResponse.json({
      inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouses/inventory - Create or update inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId, warehouseId, quantity, reorderLevel, location } = await request.json();

    if (!productId || !warehouseId || quantity === undefined) {
      return NextResponse.json({ message: 'Product ID, warehouse ID, and quantity are required' }, { status: 400 });
    }

    // Check if inventory item already exists
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId,
        organizationId: session.user.organizationId
      }
    });

    let inventoryItem;
    if (existingItem) {
      // Update existing item
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          reorderLevel,
          location
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              image: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } else {
      // Create new item
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId,
          warehouseId,
          organizationId: session.user.organizationId,
          quantity,
          reorderLevel,
          location
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              image: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }

    return NextResponse.json(inventoryItem);

  } catch (error) {
    console.error('Error creating/updating inventory item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/warehouses/inventory - Update inventory item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, quantity, reorderLevel, location } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Inventory item ID is required' }, { status: 400 });
    }

    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
        organizationId: session.user.organizationId
      },
      data: {
        quantity,
        reorderLevel,
        location
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            image: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(inventoryItem);

  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouses/inventory - Delete inventory item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Inventory item ID is required' }, { status: 400 });
    }

    await prisma.inventoryItem.delete({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}