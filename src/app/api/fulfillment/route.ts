import { NextRequest, NextResponse } from 'next/server';
import {
  startFulfillment,
  markItemsPicked,
  markAsPacked,
  markAsShipped,
  getFulfillmentStatus,
  getPendingFulfillments,
} from '@/lib/fulfillment/automation';

export const dynamic = 'force-dynamic';

// Get fulfillments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const organizationId = searchParams.get('organizationId');

    if (orderId) {
      const fulfillment = await getFulfillmentStatus(orderId);
      return NextResponse.json({
        success: true,
        data: fulfillment,
      });
    }

    if (organizationId) {
      const fulfillments = await getPendingFulfillments(organizationId);
      return NextResponse.json({
        success: true,
        data: fulfillments,
      });
    }

    return NextResponse.json(
      { error: 'Order ID or Organization ID is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get fulfillment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fulfillment' },
      { status: 500 }
    );
  }
}

// Start fulfillment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, rules } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await startFulfillment(orderId, rules);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.fulfillment,
        message: 'Fulfillment started successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Start fulfillment error:', error);
    return NextResponse.json(
      { error: error.message || 'Fulfillment start failed' },
      { status: 500 }
    );
  }
}

// Update fulfillment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { fulfillmentId, action, data } = body;

    if (!fulfillmentId || !action) {
      return NextResponse.json(
        { error: 'Fulfillment ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'pick':
        result = await markItemsPicked(fulfillmentId, data.itemIds);
        break;
      case 'pack':
        result = await markAsPacked(fulfillmentId, data);
        break;
      case 'ship':
        result = await markAsShipped(fulfillmentId, data);
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
        message: `Fulfillment ${action} completed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Update fulfillment error:', error);
    return NextResponse.json(
      { error: error.message || 'Fulfillment update failed' },
      { status: 500 }
    );
  }
}

