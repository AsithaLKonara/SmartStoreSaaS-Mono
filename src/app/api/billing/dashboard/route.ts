import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const organizationId = request.user!.organizationId;

    // Get organization billing information
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        settings: true
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get user count for the organization
    const userCount = await prisma.user.count({
      where: { 
        organizationId,
        isActive: true
      }
    });

    // Get order count and revenue
    const orderStats = await prisma.order.aggregate({
      where: {
        organizationId,
        status: { notIn: ['CANCELLED', 'RETURNED'] }
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // Mock billing data for demonstration
    const billingData = {
      currentPlan: {
        name: 'Pro Plan',
        price: 99,
        features: ['Unlimited Products', 'AI Analytics', 'Priority Support'],
        status: 'active',
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      usage: {
        users: userCount,
        maxUsers: 100,
        products: 'Unlimited',
        aiFeatures: 'Full Access',
        support: 'Priority'
      },
      statistics: {
        totalOrders: orderStats._count.id || 0,
        totalRevenue: orderStats._sum.totalAmount || 0,
        monthlyRecurring: 99
      },
      paymentMethods: [],
      billingHistory: [],
      settings: {
        autoRenew: true,
        invoiceEmail: request.user!.email
      }
    };

    return NextResponse.json({
      success: true,
      data: billingData
    });

  } catch (error) {
    console.error('Error fetching billing dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing dashboard' },
      { status: 500 }
    );
  }
}

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});
