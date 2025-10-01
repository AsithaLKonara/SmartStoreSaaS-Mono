export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await db.subscription.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        customer: true,
        invoices: {
          orderBy: { billingDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error) {
    apiLogger.error('Error fetching subscriptions', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST - Create subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, planName, planType, amount, billingInterval, paymentMethod } = body;

    const now = new Date();
    const nextBilling = new Date(now);
    if (billingInterval === 'month') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    const subscription = await db.subscription.create({
      data: {
        organizationId: session.user.organizationId,
        customerId,
        planName,
        planType,
        amount: parseFloat(amount),
        billingInterval,
        paymentMethod,
        currentPeriodStart: now,
        currentPeriodEnd: nextBilling,
        nextBillingDate: nextBilling,
      },
    });

    apiLogger.info('Subscription created', { subscriptionId: subscription.id });

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    apiLogger.error('Error creating subscription', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create subscription' }, { status: 500 });
  }
}

