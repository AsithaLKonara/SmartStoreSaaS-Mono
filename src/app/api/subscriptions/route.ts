import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Mock subscriptions data - table doesn't exist in DB yet
    const subscriptions = [
      {
        id: 'sub-1',
        organizationId: 'org-1',
        planType: 'PRO',
        status: 'ACTIVE',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        organization: { name: 'Demo Organization' }
      }
    ];

    return NextResponse.json({
      success: true,
      subscriptions,
      data: subscriptions
    });
  } catch (error: any) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock response - table doesn't exist in DB yet
    const subscription = {
      id: `sub-${Date.now()}`,
      ...body,
      organization: { name: 'Demo Organization' }
    };

    return NextResponse.json({
      success: true,
      subscription,
      data: subscription
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock response - table doesn't exist in DB yet
    const subscription = {
      id: body.id,
      ...body
    };

    return NextResponse.json({
      success: true,
      subscription,
      data: subscription
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
