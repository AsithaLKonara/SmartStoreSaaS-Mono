import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// POST /api/coupons/validate - Validate coupon
async function validateCoupon(request: AuthRequest) {
  try {
    const { code, orderAmount, customerId } = await request.json();

    if (!code || !orderAmount) {
      return NextResponse.json({ error: 'Coupon code and order amount required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        organizationId: request.user!.organizationId,
        isActive: true
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if coupon is within validity period
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ error: 'Coupon not yet valid' }, { status: 400 });
    }

    if (coupon.validTo && now > coupon.validTo) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json({ 
        error: `Minimum order amount of ${coupon.minOrderAmount} LKR required` 
      }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit exceeded' }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'FREE_SHIPPING') {
      discountAmount = 0; // Will be handled separately
    }

    // Apply maximum discount limit
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // Check if customer has already used this coupon
    if (customerId) {
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          customerId
        }
      });

      if (existingUsage) {
        return NextResponse.json({ error: 'Coupon already used by this customer' }, { status: 400 });
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        isFreeShipping: coupon.type === 'FREE_SHIPPING'
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = createAuthHandler(validateCoupon, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});