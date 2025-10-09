import { NextRequest, NextResponse } from 'next/server';
import {
  createReturnRequest,
  approveReturnRequest,
  rejectReturnRequest,
  markReturnReceived,
  processRefund,
  getReturnRequests,
} from '@/lib/returns/manager';

export const dynamic = 'force-dynamic';

// Get returns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const returns = await getReturnRequests({
      organizationId: organizationId || undefined,
      customerId: customerId || undefined,
      status: status as any,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: returns,
    });
  } catch (error: any) {
    console.error('Get returns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// Create return request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, items, notes, refundMethod } = body;

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Order ID and items are required' },
        { status: 400 }
      );
    }

    const result = await createReturnRequest({
      orderId,
      items,
      notes,
      refundMethod,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.returnRequest,
        message: 'Return request created successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Create return error:', error);
    return NextResponse.json(
      { error: error.message || 'Return request creation failed' },
      { status: 500 }
    );
  }
}

// Update return status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId, action, notes, reason } = body;

    if (!returnId || !action) {
      return NextResponse.json(
        { error: 'Return ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        result = await approveReturnRequest(returnId, notes);
        break;
      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for rejection' },
            { status: 400 }
          );
        }
        result = await rejectReturnRequest(returnId, reason);
        break;
      case 'received':
        result = await markReturnReceived(returnId);
        break;
      case 'refund':
        result = await processRefund(returnId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Return ${action} processed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Update return error:', error);
    return NextResponse.json(
      { error: error.message || 'Return update failed' },
      { status: 500 }
    );
  }
}
