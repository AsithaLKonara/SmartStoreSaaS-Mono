import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  changeSubscriptionPlan,
  getCustomerSubscriptions,
} from '@/lib/subscriptions/manager';

export const dynamic = 'force-dynamic';

// Get subscriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const subscriptions = await getCustomerSubscriptions(customerId);

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: any) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// Create subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, planId, startDate, trialEndDate } = body;

    if (!customerId || !planId) {
      return NextResponse.json(
        { error: 'Customer ID and plan ID are required' },
        { status: 400 }
      );
    }

    const result = await createSubscription({
      customerId,
      planId,
      startDate: startDate ? new Date(startDate) : undefined,
      trialEndDate: trialEndDate ? new Date(trialEndDate) : undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.subscription,
        message: 'Subscription created successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Subscription creation failed' },
      { status: 500 }
    );
  }
}

// Update subscription
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, action, newPlanId, immediately } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Subscription ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscriptionId, immediately);
        break;
      case 'pause':
        result = await pauseSubscription(subscriptionId);
        break;
      case 'resume':
        result = await resumeSubscription(subscriptionId);
        break;
      case 'change-plan':
        if (!newPlanId) {
          return NextResponse.json(
            { error: 'New plan ID is required' },
            { status: 400 }
          );
        }
        result = await changeSubscriptionPlan(subscriptionId, newPlanId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Subscription ${action}ed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Subscription update failed' },
      { status: 500 }
    );
  }
}
