import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization billing information
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get user count for the organization
    const userCount = await prisma.user.count({
      where: { 
        organizationId: session.user.organizationId,
        isActive: true
      }
    });

    // Extract billing settings from organization settings
    const billingSettings = organization.settings?.billing || {
      paymentMethods: [],
      billingHistory: [],
      autoRenew: true,
      invoiceEmail: session.user.email
    };

    // Mock billing data for demonstration
    const billingData = {
      currentPlan: {
        name: organization.plan,
        price: getPlanPrice(organization.plan),
        features: getPlanFeatures(organization.plan),
        status: organization.status,
        nextBilling: getNextBillingDate(organization.createdAt)
      },
      usage: {
        users: userCount,
        maxUsers: getMaxUsers(organization.plan),
        products: 'Unlimited',
        aiFeatures: 'Full Access',
        support: getSupportLevel(organization.plan)
      },
      paymentMethods: billingSettings.paymentMethods,
      billingHistory: billingSettings.billingHistory || getMockBillingHistory(),
      settings: {
        autoRenew: billingSettings.autoRenew,
        invoiceEmail: billingSettings.invoiceEmail
      }
    };

    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { autoRenew, invoiceEmail } = body;

    // Get current organization settings
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update billing settings within organization settings
    const updatedSettings = {
      ...organization.settings,
      billing: {
        ...organization.settings?.billing,
        autoRenew: !!autoRenew,
        invoiceEmail: invoiceEmail || session.user.email
      }
    };

    // Update organization with new billing settings
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { settings: updatedSettings }
    });

    return NextResponse.json({ message: 'Billing settings updated successfully' });
  } catch (error) {
    console.error('Error updating billing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for mock data
function getPlanPrice(plan: string): string {
  const prices: Record<string, string> = {
    'FREE': '$0/month',
    'BASIC': '$19/month',
    'PRO': '$29/month',
    'ENTERPRISE': '$99/month'
  };
  return prices[plan] || '$0/month';
}

function getMaxUsers(plan: string): number {
  const limits: Record<string, number> = {
    'FREE': 2,
    'BASIC': 5,
    'PRO': 10,
    'ENTERPRISE': 50
  };
  return limits[plan] || 2;
}

function getSupportLevel(plan: string): string {
  const support: Record<string, string> = {
    'FREE': 'Community',
    'BASIC': 'Email',
    'PRO': 'Priority',
    'ENTERPRISE': '24/7'
  };
  return support[plan] || 'Community';
}

function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    'FREE': ['Basic Analytics', '5 Products', 'Community Support'],
    'BASIC': ['Advanced Analytics', 'Unlimited Products', 'Email Support', 'Basic AI Features'],
    'PRO': ['Advanced Analytics', 'Unlimited Products', 'Priority Support', 'Full AI Features', 'Custom Integrations'],
    'ENTERPRISE': ['Advanced Analytics', 'Unlimited Products', '24/7 Support', 'Full AI Features', 'Custom Integrations', 'White-label', 'API Access']
  };
  return features[plan] || ['Basic Analytics'];
}

function getNextBillingDate(createdAt: Date): string {
  const nextDate = new Date(createdAt);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function getMockBillingHistory() {
  const currentDate = new Date();
  return [
    {
      date: currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: '$29.00',
      status: 'Paid',
      invoice: 'INV-001'
    },
    {
      date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: '$29.00',
      status: 'Paid',
      invoice: 'INV-002'
    },
    {
      date: new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: '$29.00',
      status: 'Paid',
      invoice: 'INV-003'
    }
  ];
}
