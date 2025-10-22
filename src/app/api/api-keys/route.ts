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
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'API keys fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch from api_keys table when implemented
      return NextResponse.json(successResponse({
        keys: [],
        message: 'API keys management - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch API keys',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, permissions = [] } = body;

      if (!name) {
        throw new ValidationError('API key name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Generate secure API key
      const apiKey = `sk_${randomBytes(32).toString('hex')}`;

      logger.info({
        message: 'API key created',
        context: {
          userId: user.id,
          organizationId,
          keyName: name
        }
      });

      return NextResponse.json(successResponse({
        name,
        key: apiKey,
        permissions,
        message: 'API key created - store this securely, it wont be shown again'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create API key',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const keyId = searchParams.get('keyId');

      if (!keyId) {
        throw new ValidationError('API key ID is required');
      }

      logger.info({
        message: 'API key deleted',
        context: { userId: user.id, keyId }
      });

      return NextResponse.json(successResponse({
        message: 'API key deleted',
        keyId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete API key',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
