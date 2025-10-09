import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyStatus, addPoints, redeemPoints, getLoyaltyHistory } from '@/lib/loyalty/program';

export const dynamic = 'force-dynamic';

// Get loyalty status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const action = searchParams.get('action') || 'status';

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (action === 'history') {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
      const history = await getLoyaltyHistory(customerId, limit);
      return NextResponse.json({ success: true, data: history });
    }

    const status = await getLoyaltyStatus(customerId);
    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loyalty data' },
      { status: 500 }
    );
  }
}

// Add or redeem points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, points, action, reason, orderId } = body;

    if (!customerId || !points || !action) {
      return NextResponse.json(
        { error: 'Customer ID, points, and action are required' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'add') {
      result = await addPoints(customerId, points, reason || 'Manual addition', orderId);
    } else if (action === 'redeem') {
      result = await redeemPoints(customerId, points, reason || 'Redeemed', orderId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "redeem"' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Points ${action}ed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Operation failed' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Loyalty POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Loyalty operation failed' },
      { status: 500 }
    );
  }
}

