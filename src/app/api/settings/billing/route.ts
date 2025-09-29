import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get user count for the organization
    const userCount = await prisma.user.count({
      where: { 
        organizationId,
        isActive: true
      }
    });

    // Extract billing settings from organization settings
    const billingSettings = organization.settings?.billing || {
      paymentMethods: [],
      billingHistory: [],
      autoRenew: true,
      invoiceEmail: request.user!.email
    };

    // Mock billing data for demonstration
    const billingData = {
      currentPlan: {
        name: 'Pro Plan',
        price: 99,
        features: ['Unlimited Products', 'AI Analytics', 'Priority Support'],
        status: 'active',
        nextBilling: getNextBillingDate(organization.createdAt)
      },
      usage: {
        users: userCount,
        maxUsers: getMaxUsers('Pro Plan'),
        products: 'Unlimited',
        aiFeatures: 'Full Access',
        support: getSupportLevel('Pro Plan')
      },
      paymentMethods: billingSettings.paymentMethods,
      billingHistory: billingSettings.billingHistory || getMockBillingHistory(),
      settings: {
        autoRenew: billingSettings.autoRenew,
        invoiceEmail: billingSettings.invoiceEmail
      }
    };

    return NextResponse.json({
      success: true,
      data: billingData
    });

  } catch (error) {
    console.error('Error fetching billing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getPlanPrice(plan: string): number {
  const prices: Record<string, number> = {
    'FREE': 0,
    'BASIC': 29,
    'PRO': 99,
    'ENTERPRISE': 299
  };
  return prices[plan] || 99;
}

function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    'FREE': ['Basic Features', 'Email Support'],
    'BASIC': ['All Free Features', 'Priority Support', 'Basic Analytics'],
    'PRO': ['All Basic Features', 'AI Analytics', 'Advanced Reports', 'API Access'],
    'ENTERPRISE': ['All Pro Features', 'Dedicated Support', 'Custom Integrations', 'White Label']
  };
  return features[plan] || features['PRO'];
}

function getMaxUsers(plan: string): number {
  const limits: Record<string, number> = {
    'FREE': 2,
    'BASIC': 10,
    'PRO': 100,
    'ENTERPRISE': 1000
  };
  return limits[plan] || 100;
}

function getSupportLevel(plan: string): string {
  const support: Record<string, string> = {
    'FREE': 'Email',
    'BASIC': 'Email + Chat',
    'PRO': 'Priority Support',
    'ENTERPRISE': 'Dedicated Support'
  };
  return support[plan] || 'Priority Support';
}

function getNextBillingDate(createdAt: Date): Date {
  const nextMonth = new Date(createdAt);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth;
}

function getMockBillingHistory() {
  return [
    {
      id: 'inv_001',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    },
    {
      id: 'inv_002',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - Monthly'
    }
  ];
}

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});