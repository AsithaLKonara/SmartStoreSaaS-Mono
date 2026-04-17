import { Stripe } from 'stripe';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export class StripeConnectService {
  private _stripe: Stripe | null = null;

  private get stripe() {
    if (!this._stripe) {
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27' as any,
      });
    }
    return this._stripe;
  }

  /**
   * Create a Standard Express account for a tenant
   */
  async createConnectAccount(organizationId: string, email: string) {
    try {
      // 1. Check if org already has an account
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { stripeConnectId: true }
      });

      if (org?.stripeConnectId) {
        return { accountId: org.stripeConnectId, alreadyExists: true };
      }

      // 2. Create the Stripe account
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { organizationId }
      });

      // 3. Save to DB
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeConnectId: account.id }
      });

      logger.info({
        message: 'Stripe Connect: Account created',
        context: { organizationId, accountId: account.id }
      });

      return { accountId: account.id, alreadyExists: false };
    } catch (error) {
      logger.error({
        message: 'Stripe Connect: Creation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
      throw error;
    }
  }

  /**
   * Generate an onboarding link for the merchant
   */
  async createOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      logger.error({
        message: 'Stripe Connect: Link generation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { accountId }
      });
      throw error;
    }
  }

  /**
   * Check account status
   */
  async getAccountStatus(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements
      };
    } catch (error) {
      return { error: 'Failed to retrieve account status' };
    }
  }
}

export const stripeConnectService = new StripeConnectService();
