import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - List all warehouses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;

    const warehouses = await prisma.warehouses.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total: warehouses.length,
      active: warehouses.filter(w => w.isActive).length,
      inactive: warehouses.filter(w => !w.isActive).length,
    };

    return NextResponse.json({
      success: true,
      warehouses,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, address, city, country, phone, email, manager } = body;

    if (!name || !code) {
      return NextResponse.json({
        success: false,
        message: 'Name and code are required'
      }, { status: 400 });
    }

    const warehouse = await prisma.warehouses.create({
      data: {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: session.user.organizationId,
        name,
        code,
        address: address || '',
        city: city || '',
        country: country || '',
        phone: phone || '',
        email: email || '',
        manager: manager || '',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      warehouse,
      message: 'Warehouse created successfully'
    });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

