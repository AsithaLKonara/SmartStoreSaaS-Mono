import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Use string literals for OrderStatus since Prisma enums might not be available
const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
} as const;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodTypes: string[];
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billing_details: {
    name: string | null; // Changed to allow null from Stripe API
    email: string | null; // Changed to allow null from Stripe API
    address: unknown;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export class StripeService {
  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethodTypes: paymentIntent.payment_method_types,
      };
    } catch (error) {
      logger.error({
        message: 'Error creating payment intent',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'createPaymentIntent', amount, currency, customerId }
      });
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      return customer.id;
    } catch (error) {
      logger.error({
        message: 'Error creating Stripe customer',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'createCustomer', email, name }
      });
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Retrieve payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
        billing_details: pm.billing_details,
      }));
    } catch (error) {
      logger.error({
        message: 'Error retrieving payment methods',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'getPaymentMethods', customerId }
      });
      throw new Error('Failed to retrieve payment methods');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<unknown> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      logger.error({
        message: 'Error creating subscription',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'createSubscription', customerId, priceId }
      });
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<unknown> {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      logger.error({
        message: 'Error canceling subscription',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'cancelSubscription', subscriptionId }
      });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<unknown> {
    try {
      const refundData: unknown = {
        payment_intent: paymentIntentId,
        reason,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      return await stripe.refunds.create(refundData);
    } catch (error) {
      logger.error({
        message: 'Error creating refund',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'createRefund', paymentIntentId, amount, reason }
      });
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(body: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          logger.warn({
            message: 'Unhandled event type',
            context: { service: 'StripeService', operation: 'handleWebhook', eventType: event.type }
          });
      }
    } catch (error) {
      logger.error({
        message: 'Error handling webhook',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handleWebhook' }
      });
      throw new Error('Webhook signature verification failed');
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update order status in database
      await prisma.order.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: OrderStatus.CONFIRMED,
        },
      });

      // Trigger order fulfillment workflow
      // This would integrate with your workflow engine
      logger.info({
        message: 'Payment succeeded',
        context: { service: 'StripeService', operation: 'handlePaymentSucceeded', paymentIntentId: paymentIntent.id, orderId: paymentIntent.metadata?.orderId }
      });
    } catch (error) {
      logger.error({
        message: 'Error handling payment succeeded',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handlePaymentSucceeded', paymentIntentId: paymentIntent.id }
      });
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update order status
      await prisma.order.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      logger.warn({
        message: 'Payment failed',
        context: { service: 'StripeService', operation: 'handlePaymentFailed', paymentIntentId: paymentIntent.id, orderId: paymentIntent.metadata?.orderId }
      });
    } catch (error) {
      logger.error({
        message: 'Error handling payment failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handlePaymentFailed', paymentIntentId: paymentIntent.id }
      });
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Create subscription record in database
      await prisma.subscription.create({
        data: {
          stripeSubscriptionId: subscription.id,
          customerId: subscription.customer as string,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          // Add other relevant fields
        },
      });

      logger.info({
        message: 'Subscription created',
        context: { service: 'StripeService', operation: 'handleSubscriptionCreated', subscriptionId: subscription.id, customerId: subscription.customer as string }
      });
    } catch (error) {
      logger.error({
        message: 'Error handling subscription created',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handleSubscriptionCreated', subscriptionId: subscription.id }
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      logger.info({
        message: 'Subscription updated',
        context: { service: 'StripeService', operation: 'handleSubscriptionUpdated', subscriptionId: subscription.id, status: subscription.status }
      });
    } catch (error) {
      logger.error({
        message: 'Error handling subscription updated',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handleSubscriptionUpdated', subscriptionId: subscription.id }
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: 'canceled',
        },
      });

      logger.info({
        message: 'Subscription canceled',
        context: { service: 'StripeService', operation: 'handleSubscriptionDeleted', subscriptionId: subscription.id }
      });
    } catch (error) {
      logger.error({
        message: 'Error handling subscription deleted',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'handleSubscriptionDeleted', subscriptionId: subscription.id }
      });
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info({
      message: 'Invoice payment succeeded',
      context: { service: 'StripeService', operation: 'handleInvoicePaymentSucceeded', invoiceId: invoice.id, customerId: invoice.customer as string }
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.warn({
      message: 'Invoice payment failed',
      context: { service: 'StripeService', operation: 'handleInvoicePaymentFailed', invoiceId: invoice.id, customerId: invoice.customer as string }
    });
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product'],
      });

      return prices.data.map(price => {
        const product = price.product as Stripe.Product;
        return {
          id: price.id,
          name: product.name,
          description: product.description || '',
          amount: price.unit_amount! / 100,
          currency: price.currency,
          interval: price.recurring!.interval as 'month' | 'year',
          features: product.metadata?.features ? 
            JSON.parse(product.metadata.features) : [],
        };
      });
    } catch (error) {
      logger.error({
        message: 'Error retrieving subscription plans',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'getSubscriptionPlans' }
      });
      throw new Error('Failed to retrieve subscription plans');
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        clientSecret: setupIntent.client_secret!,
      };
    } catch (error) {
      logger.error({
        message: 'Error creating setup intent',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'StripeService', operation: 'createSetupIntent', customerId }
      });
      throw new Error('Failed to create setup intent');
    }
  }
}

export const stripeService = new StripeService();
