import { NextRequest, NextResponse } from 'next/server';
import { billingService } from '@/lib/billing/billingService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization ID from authenticated user
    // For now, using a mock organization ID
    const organizationId = 'cmfvk2j200000udj9tbuo83yu';

    const billingData = await billingService.getBillingDashboard(organizationId);

    return NextResponse.json(billingData);

  } catch (error) {
    console.error('Error fetching billing dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing dashboard' },
      { status: 500 }
    );
  }
}
