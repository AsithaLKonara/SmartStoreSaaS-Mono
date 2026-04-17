import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { stripeConnectService } from '@/lib/payments/stripeConnect';
import { logger } from '@/lib/logger';

/**
 * POST /api/payments/stripe/connect/onboard
 * Initiates the Stripe Connect onboarding flow for the authenticated organization
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized: No organization context' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const email = session.user.email!;

    // 1. Create or retrieve the Connect account
    const { accountId } = await stripeConnectService.createConnectAccount(organizationId, email);

    // 2. Generate onboarding link
    const protocol = req.nextUrl.protocol;
    const host = req.headers.get('host');
    const baseUrl = `${protocol}//${host}`;

    const onboardingUrl = await stripeConnectService.createOnboardingLink(
      accountId,
      `${baseUrl}/settings/payments?status=onboard_success`,
      `${baseUrl}/settings/payments?status=onboard_refresh`
    );

    logger.info({
      message: 'Stripe Connect: Onboarding initiated',
      context: { organizationId, accountId }
    });

    return NextResponse.json({ url: onboardingUrl });
  } catch (error) {
    logger.error({
      message: 'Stripe Connect: Onboarding failed',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json({ error: 'Failed to initiate onboarding' }, { status: 500 });
  }
}
