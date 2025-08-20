// Export payment services
export { PayPalService } from './paypalService';
export { StripeService } from './stripeService';
export { AdvancedPaymentService } from './advancedPaymentService';

// Create service instances for easy import
import { PayPalService } from './paypalService';
import { StripeService } from './stripeService';
import { AdvancedPaymentService } from './advancedPaymentService';

// Default instances (these would be configured with environment variables in production)
export const paypalService = new PayPalService({
  _clientId: process.env.PAYPAL_CLIENT_ID || '',
  _clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  _webhookId: process.env.PAYPAL_WEBHOOK_ID
});

export const stripeService = new StripeService({
  _secretKey: process.env.STRIPE_SECRET_KEY || '',
  _publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  _webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
});

export const advancedPaymentService = new AdvancedPaymentService({
  paypalService,
  stripeService
});
