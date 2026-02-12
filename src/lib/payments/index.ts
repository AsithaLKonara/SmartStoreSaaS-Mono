// Export payment services
export { PayPalService } from './paypalService';
export { StripeService } from './stripeService';
export { AdvancedPaymentService } from './advancedPaymentService';

// Create service instances for easy import
import { PayPalService } from './paypalService';
import { StripeService } from './stripeService';
import { AdvancedPaymentService } from './advancedPaymentService';

// Default instances (these would be configured with environment variables in production)
export const paypalService = new PayPalService(); // Fix: Constructor doesn't take arguments

export const stripeService = new StripeService(); // Fix: Constructor doesn't take arguments

export const advancedPaymentService = new AdvancedPaymentService(); // Fix: Constructor doesn't take arguments
