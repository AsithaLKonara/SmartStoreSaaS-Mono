import { NextRequest, NextResponse } from 'next/server';
import {
  createSupplier,
  updateSupplier,
  getSuppliers,
  getSupplier,
  rateSupplier,
  getSupplierPerformance,
} from '@/lib/suppliers/manager';

export const dynamic = 'force-dynamic';

// Get suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const supplierId = searchParams.get('supplierId');
    const action = searchParams.get('action');

    if (supplierId && action === 'performance') {
      const performance = await getSupplierPerformance(supplierId);
      return NextResponse.json({ success: true, data: performance });
    }

    if (supplierId) {
      const supplier = await getSupplier(supplierId);
      return NextResponse.json({ success: true, data: supplier });
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const suppliers = await getSuppliers(organizationId, {
      isActive: isActive ? isActive === 'true' : undefined,
      search: search || undefined,
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error('Get suppliers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// Create supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...data } = body;

    if (!organizationId || !data.name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      );
    }

    const result = await createSupplier({ ...data, organizationId });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.supplier,
        message: 'Supplier created successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: error.message || 'Supplier creation failed' },
      { status: 500 }
    );
  }
}

// Update supplier
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, action, ...data } = body;

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    if (action === 'rate') {
      const result = await rateSupplier(supplierId, data.rating, data.notes);
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Supplier rated successfully' });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }

    const result = await updateSupplier(supplierId, data);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Supplier updated successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Update supplier error:', error);
    return NextResponse.json(
      { error: error.message || 'Supplier update failed' },
      { status: 500 }
    );
  }
}

