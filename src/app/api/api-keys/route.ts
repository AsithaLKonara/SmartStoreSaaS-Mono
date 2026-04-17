/**
 * API Keys Management Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_API_KEYS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_API_KEYS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_API_KEYS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);
      if (!orgId) throw new ValidationError('Organization scope required');

      const keys = await prisma.apiKey.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          permissions: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
          expiresAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(successResponse({ keys }));
    } catch (error: any) {
      logger.error({ message: 'Failed to fetch API keys', error, context: { userId: user.id } });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, permissions = [], expiresAt } = body;

      if (!name) throw new ValidationError('API key name is required');

      const organizationId = user.organizationId;
      if (!organizationId) throw new ValidationError('User must belong to an organization');

      // Generate secure API key
      const key = `sk_${randomBytes(24).toString('hex')}`;

      const newKey = await prisma.apiKey.create({
        data: {
          key,
          name,
          permissions,
          organizationId,
          userId: user.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true
        }
      });

      logger.info({
        message: 'API key created',
        context: { userId: user.id, organizationId, keyId: newKey.id }
      });

      return NextResponse.json(successResponse({
        id: newKey.id,
        name: newKey.name,
        key, // Only shown once at creation
        message: 'API key created - store this securely'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({ message: 'Failed to create API key', error, context: { userId: user.id } });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const keyId = searchParams.get('keyId');
      const orgId = getOrganizationScope(user);

      if (!keyId) throw new ValidationError('API key ID is required');

      await prisma.apiKey.delete({
        where: { 
          id: keyId,
          organizationId: orgId
        }
      });

      return NextResponse.json(successResponse({ message: 'API key revoked successfully' }));
    } catch (error: any) {
      logger.error({ message: 'Failed to delete API key', error, context: { userId: user.id } });
      throw error;
    }
  }
);
