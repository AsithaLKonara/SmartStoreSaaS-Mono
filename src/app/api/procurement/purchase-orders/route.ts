import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List purchase orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            items: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      count: purchaseOrders.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching purchase orders', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST - Create purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplierId,
      expectedDate,
      items,
      shippingAddress,
      shippingMethod,
      notes,
    } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Supplier and items are required' },
        { status: 400 }
      );
    }

    // Generate PO number
    const count = await db.purchaseOrder.count({
      where: { organizationId: session.user.organizationId },
    });
    const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const poItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate || 0) / 100;
      subtotal += itemTotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        taxRate: item.taxRate || 0,
        totalPrice: itemTotal + itemTax,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        organizationId: session.user.organizationId,
        poNumber,
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        taxAmount,
        totalAmount,
        shippingAddress,
        shippingMethod,
        requestedBy: session.user.id,
        notes,
        items: {
          create: poItems,
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    apiLogger.info('Purchase order created', { poId: purchaseOrder.id, poNumber });

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    apiLogger.error('Error creating purchase order', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create purchase order' }, { status: 500 });
  }
}

