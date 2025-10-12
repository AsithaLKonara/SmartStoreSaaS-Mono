/**
 * API Key Management System
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface APIKeyData {
  id: string;
  key: string;
  name: string;
  organizationId: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Generate a secure API key
 */
export function generateAPIKey(): string {
  const prefix = 'sk_live';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

/**
 * Hash API key for storage
 */
export function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key
 */
export async function createAPIKey(data: {
  name: string;
  organizationId: string;
  userId: string;
  permissions?: string[];
  expiresAt?: Date;
}): Promise<{ key: string; keyData: any }> {
  const apiKey = generateAPIKey();
  const hashedKey = hashAPIKey(apiKey);

  const keyData = await prisma.apiKey.create({
    data: {
      key: hashedKey,
      name: data.name,
      organizationId: data.organizationId,
      userId: data.userId,
      permissions: data.permissions || [],
      expiresAt: data.expiresAt,
      isActive: true,
    },
  });

  return { key: apiKey, keyData };
}

/**
 * Validate API key
 */
export async function validateAPIKey(key: string): Promise<{
  isValid: boolean;
  keyData?: any;
  error?: string;
}> {
  try {
    const hashedKey = hashAPIKey(key);

    const keyData = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        organization: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!keyData) {
      return { isValid: false, error: 'Invalid API key' };
    }

    if (!keyData.isActive) {
      return { isValid: false, error: 'API key is inactive' };
    }

    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyData.id },
      data: { lastUsedAt: new Date() },
    });

    return { isValid: true, keyData };
  } catch (error) {
    console.error('API key validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Revoke API key
 */
export async function revokeAPIKey(keyId: string): Promise<boolean> {
  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
    return true;
  } catch (error) {
    console.error('API key revocation error:', error);
    return false;
  }
}

/**
 * List API keys for organization
 */
export async function listAPIKeys(organizationId: string) {
  return await prisma.apiKey.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      permissions: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if API key has permission
 */
export function hasAPIKeyPermission(keyData: any, permission: string): boolean {
  if (!keyData.permissions || keyData.permissions.length === 0) {
    return true; // Full access if no permissions specified
  }
  return keyData.permissions.includes(permission) || keyData.permissions.includes('*');
}

