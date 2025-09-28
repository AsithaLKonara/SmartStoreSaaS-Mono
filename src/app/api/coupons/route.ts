import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/coupons - Get coupons
async function getCoupons(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: any = {
      organizationId: request.user!.organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.coupon.count({ where })
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coupons - Create coupon
async function createCoupon(request: AuthRequest) {
  try {

    const {
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validTo
    } = await request.json();

    if (!code || !name || !type || !value) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        code,
        organizationId: request.user!.organizationId
      }
    });

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        type,
        value,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        organizationId: request.user!.organizationId
      }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/coupons - Update coupon
async function updateCoupon(request: AuthRequest) {
  try {

    const {
      id,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      isActive,
      validFrom,
      validTo
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: {
        id,
        organizationId: request.user!.organizationId
      },
      data: {
        name,
        description,
        type,
        value,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        isActive,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null
      }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/coupons - Delete coupon
async function deleteCoupon(request: AuthRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: {
        id,
        organizationId: request.user!.organizationId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export protected handlers with security middleware
export const GET = createAuthHandler(getCoupons, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(createCoupon, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});

export const PUT = createAuthHandler(updateCoupon, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});

export const DELETE = createAuthHandler(deleteCoupon, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});