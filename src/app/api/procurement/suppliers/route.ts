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
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [suppliers, total] = await Promise.all([
      prisma.suppliers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              purchase_orders: true,
              products: true,
            },
          },
        },
      }),
      prisma.suppliers.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch suppliers' },
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
      name,
      email,
      phone,
      contactPerson,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      currency,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if supplier already exists
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        organizationId: session.user.organizationId,
        email,
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { success: false, message: 'Supplier with this email already exists' },
        { status: 400 }
      );
    }

    const supplier = await prisma.suppliers.create({
      data: {
        id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: session.user.organizationId,
        name,
        email,
        phone,
        contactPerson,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        paymentTerms: paymentTerms || 'NET_30',
        currency: currency || 'USD',
        status: status || 'ACTIVE',
        notes,
        rating: 0,
        totalOrders: 0,
        totalValue: 0,
        lastOrderDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}