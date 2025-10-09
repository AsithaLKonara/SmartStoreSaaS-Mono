import { NextRequest, NextResponse } from 'next/server';
import { recordStockMovement, getStockHistory, batchUpdateStock } from '@/lib/inventory/management';

export const dynamic = 'force-dynamic';

// Record stock movement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, type, reason, warehouseId, reference, organizationId } = body;

    if (!productId || !quantity || !type || !organizationId) {
      return NextResponse.json(
        { error: 'Product ID, quantity, type, and organization ID are required' },
        { status: 400 }
      );
    }

    const result = await recordStockMovement(
      { productId, quantity, type, reason, warehouseId, reference },
      organizationId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        newStock: result.newStock,
        message: 'Stock movement recorded successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Stock movement API error:', error);
    return NextResponse.json(
      { error: error.message || 'Stock movement failed' },
      { status: 500 }
    );
  }
}

// Get stock history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const history = await getStockHistory(productId, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Stock history API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
}

// Batch update stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, organizationId } = body;

    if (!updates || !Array.isArray(updates) || !organizationId) {
      return NextResponse.json(
        { error: 'Updates array and organization ID are required' },
        { status: 400 }
      );
    }

    const result = await batchUpdateStock(updates, organizationId);

    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Batch update API error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch update failed' },
      { status: 500 }
    );
  }
}

