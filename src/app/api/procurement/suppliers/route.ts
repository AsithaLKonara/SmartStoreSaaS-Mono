export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (category) where.category = category;

    const suppliers = await db.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching suppliers', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      website,
      taxId,
      address,
      city,
      state,
      country,
      postalCode,
      paymentTerms,
      currency,
      creditLimit,
      category,
      notes,
    } = body;

    if (!companyName || !email) {
      return NextResponse.json(
        { success: false, message: 'Company name and email are required' },
        { status: 400 }
      );
    }

    // Generate supplier code
    const count = await db.supplier.count({
      where: { organizationId: session.user.organizationId },
    });
    const supplierCode = `SUP-${(count + 1).toString().padStart(5, '0')}`;

    const supplier = await db.supplier.create({
      data: {
        organizationId: session.user.organizationId,
        supplierCode,
        companyName,
        contactName,
        email,
        phone,
        website,
        taxId,
        address,
        city,
        state,
        country,
        postalCode,
        paymentTerms,
        currency: currency || 'USD',
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        category,
        notes,
      },
    });

    apiLogger.info('Supplier created', { supplierId: supplier.id, supplierCode });

    return NextResponse.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    apiLogger.error('Error creating supplier', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create supplier' }, { status: 500 });
  }
}

