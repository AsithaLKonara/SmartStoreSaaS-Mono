import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Generate a new MFA secret for a user
 */
export async function generateMfaSecret(userId: string, email: string) {
  const secret = speakeasy.generateSecret({
    name: `SmartStoreSaaS (${email})`,
    issuer: 'SmartStoreSaaS',
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl,
  };
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyMfaCode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1, // Allow 1 step (30s) before/after for clock drift
  });
}

/**
 * Enable MFA for a user after successful verification
 */
export async function enableMfa(userId: string, secret: string, backupCodes: string[]) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(backupCodes),
    },
  });
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}
