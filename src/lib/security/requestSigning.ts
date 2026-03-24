import { createHmac, timingSafeEqual } from 'crypto';

const SIGNING_SECRET = process.env.API_SIGNING_SECRET || 'fallback-signing-secret';

/**
 * Generate a signature for a request
 */
export function generateSignature(payload: string, timestamp: string): string {
  return createHmac('sha256', SIGNING_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

/**
 * Verify a request signature
 */
export function verifySignature(signature: string, payload: string, timestamp: string): boolean {
  // 1. Check if timestamp is within reasonable window (e.g., 5 minutes) to prevent replay attacks
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }

  // 2. Generate expected signature
  const expectedSignature = generateSignature(payload, timestamp);

  // 3. Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
