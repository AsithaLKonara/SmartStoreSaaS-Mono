import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // Check if they already have an account
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { stripeConnectAccountId: true }
    });

    let accountId = org?.stripeConnectAccountId;

    // Create a Stripe Custom or Express Account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // In production, infer from tenant settings
        email: session.user.email as string,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeConnectAccountId: accountId }
      });
    }

    // Generate specific Account Link for onboarding UI
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/settings/payments/refresh`,
      return_url: `${origin}/dashboard/settings/payments/return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ success: true, url: accountLink.url });

  } catch (error) {
    logger.error('Stripe Connect onboarding failed:', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to generate Stripe Connect link' },
      { status: 500 }
    );
  }
}
