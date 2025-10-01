export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where = {
      organizationId: session.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status })
    };

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      }),
      db.customer.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      status = 'active',
      notes
    } = body;

    // Check if customer already exists
    const existingCustomer = await db.customer.findFirst({
      where: {
        email,
        organizationId: session.user.organizationId
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 400 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        status,
        notes,
        organizationId: session.user.organizationId
      }
    });

    return NextResponse.json({
      success: true,
      data: customer
    }, { status: 201 });

  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to organization
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailExists = await db.customer.findFirst({
        where: {
          email: updateData.email,
          organizationId: session.user.organizationId,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to organization
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has orders
    const orderCount = await db.order.count({
      where: { customerId: id }
    });

    if (orderCount > 0) {
      // Soft delete
      await db.customer.update({
        where: { id },
        data: { status: 'inactive' }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deactivated (has orders)'
      });
    } else {
      // Hard delete
      await db.customer.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    }

  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}