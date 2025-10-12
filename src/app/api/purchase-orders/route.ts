import { NextRequest, NextResponse } from 'next/server';
import {
  createPurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrderItems,
  completePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrders,
} from '@/lib/purchase-orders/manager';

export const dynamic = 'force-dynamic';

// Get purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    const purchaseOrders = await getPurchaseOrders(organizationId, {
      status: status as any,
      supplierId: supplierId || undefined,
    });

    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error: any) {
    console.error('Get purchase orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// Create purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, supplierId, items, expectedDeliveryDate, notes } = body;

    if (!organizationId || !supplierId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Organization ID, supplier ID, and items are required' },
        { status: 400 }
      );
    }

    const result = await createPurchaseOrder({
      organizationId,
      supplierId,
      items,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.purchaseOrder,
        message: 'Purchase order created successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    return NextResponse.json(
      { error: error.message || 'Purchase order creation failed' },
      { status: 500 }
    );
  }
}

// Update purchase order
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { poId, action, ...data } = body;

    if (!poId || !action) {
      return NextResponse.json(
        { error: 'PO ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        result = await approvePurchaseOrder(poId, data.approvedBy);
        break;
      case 'send':
        result = await sendPurchaseOrder(poId);
        break;
      case 'receive':
        result = await receivePurchaseOrderItems(poId, data.receivedItems);
        break;
      case 'complete':
        result = await completePurchaseOrder(poId);
        break;
      case 'cancel':
        result = await cancelPurchaseOrder(poId, data.reason);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Purchase order ${action} completed successfully`,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Update purchase order error:', error);
    return NextResponse.json(
      { error: error.message || 'Purchase order update failed' },
      { status: 500 }
    );
  }
}

