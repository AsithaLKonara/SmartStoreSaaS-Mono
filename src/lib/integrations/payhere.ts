import crypto from 'crypto';

const merchantId = process.env.PAYHERE_MERCHANT_ID || '';
const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '';
const mode = process.env.PAYHERE_MODE || 'sandbox'; // 'sandbox' or 'live'

export interface PayHerePayment {
  orderId: string;
  amount: number;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  items: string;
}

export interface PayHereResponse {
  success: boolean;
  paymentUrl?: string;
  hash?: string;
  error?: string;
}

/**
 * Generate PayHere payment hash
 */
function generateHash(data: PayHerePayment): string {
  const hashString = [
    merchantId,
    data.orderId,
    data.amount.toFixed(2),
    data.currency,
    getMd5Hash(merchantSecret),
  ].join('');

  return getMd5Hash(hashString).toUpperCase();
}

/**
 * MD5 hash function
 */
function getMd5Hash(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Initiate PayHere payment
 */
export async function initiatePayHerePayment(
  data: PayHerePayment
): Promise<PayHereResponse> {
  try {
    if (!merchantId || !merchantSecret) {
      throw new Error('PayHere credentials not configured');
    }

    // Generate hash for security
    const hash = generateHash(data);

    // Get PayHere URL based on mode
    const payHereUrl = mode === 'live'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout';

    // PayHere requires form submission, so we return the URL and data
    // Frontend will create a form and submit it
    return {
      success: true,
      paymentUrl: payHereUrl,
      hash,
    };
  } catch (error: any) {
    console.error('PayHere initiation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate PayHere payment',
    };
  }
}

/**
 * Verify PayHere callback
 */
export async function verifyPayHereCallback(data: any): Promise<boolean> {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = data;

    // Verify merchant ID
    if (merchant_id !== merchantId) {
      console.error('Invalid merchant ID');
      return false;
    }

    // Generate expected hash
    const hashString = [
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      getMd5Hash(merchantSecret),
    ].join('');

    const expectedHash = getMd5Hash(hashString).toUpperCase();

    // Verify hash
    if (md5sig !== expectedHash) {
      console.error('Invalid hash signature');
      return false;
    }

    // Check payment status
    if (status_code !== '2') {
      console.error('Payment not successful. Status code:', status_code);
      return false;
    }

    return true;
  } catch (error) {
    console.error('PayHere verification error:', error);
    return false;
  }
}

/**
 * Get payment status codes
 */
export const PayHereStatusCodes = {
  '2': 'Success',
  '0': 'Pending',
  '-1': 'Canceled',
  '-2': 'Failed',
  '-3': 'Chargedback',
};

/**
 * Format amount for PayHere (2 decimal places)
 */
export function formatPayHereAmount(amount: number): string {
  return amount.toFixed(2);
}

