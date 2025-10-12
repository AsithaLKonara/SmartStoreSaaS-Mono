import { NextRequest, NextResponse } from 'next/server';
import { calculateInventoryValue, getReorderList } from '@/lib/inventory/management';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type') || 'value';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let data: any;

    if (type === 'value') {
      data = await calculateInventoryValue(organizationId);
    } else if (type === 'reorder') {
      data = await getReorderList(organizationId);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "value" or "reorder"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      data,
    });
  } catch (error: any) {
    console.error('Inventory value API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate inventory value' },
      { status: 500 }
    );
  }
}

