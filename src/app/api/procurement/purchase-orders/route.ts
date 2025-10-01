export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate);
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchase_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          suppliers: true,
          purchase_order_items: {
            include: {
              products: true,
            },
          },
        },
      }),
      prisma.purchase_orders.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplierId,
      orderDate,
      expectedDeliveryDate,
      items,
      notes,
      terms,
      shippingAddress,
    } = body;

    // Validate required fields
    if (!supplierId || !orderDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate supplier exists
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: supplierId,
        organizationId: session.user.organizationId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1; // 10% tax - should be configurable
    const shipping = 0; // Should be calculated based on supplier/shipping method
    const total = subtotal + tax + shipping;

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create purchase order with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchase_orders.create({
        data: {
          id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: session.user.organizationId,
          poNumber,
          supplierId,
          orderDate: new Date(orderDate),
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          status: 'DRAFT',
          subtotal,
          tax,
          shipping,
          total,
          notes,
          terms,
          shippingAddress,
          createdBy: session.user.id,
        },
      });

      // Create purchase order items
      const orderItems = await Promise.all(
        items.map((item, index) =>
          tx.purchase_order_items.create({
            data: {
              id: `poi_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              purchaseOrderId: purchaseOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              lineNumber: index + 1,
            },
          })
        )
      );

      return { purchaseOrder, items: orderItems };
    });

    return NextResponse.json({
      success: true,
      data: result.purchaseOrder,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Purchase order ID is required' },
        { status: 400 }
      );
    }

    // Verify purchase order belongs to organization
    const existingPO = await prisma.purchase_orders.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Only allow updates for DRAFT status
    if (existingPO.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, message: 'Only draft purchase orders can be updated' },
        { status: 400 }
      );
    }

    const purchaseOrder = await prisma.purchase_orders.update({
      where: { id },
      data: updateData,
      include: {
        suppliers: true,
        purchase_order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Purchase order ID is required' },
        { status: 400 }
      );
    }

    // Verify purchase order belongs to organization
    const existingPO = await prisma.purchase_orders.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion for DRAFT status
    if (existingPO.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, message: 'Only draft purchase orders can be deleted' },
        { status: 400 }
      );
    }

    // Delete purchase order and related items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete purchase order items first
      await tx.purchase_order_items.deleteMany({
        where: { purchaseOrderId: id },
      });

      // Delete purchase order
      await tx.purchase_orders.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}