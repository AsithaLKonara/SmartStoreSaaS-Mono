import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/enterprise/api-keys
 * Get API keys (SUPER_ADMIN or TENANT_ADMIN)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'API keys fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement API keys fetching
      // This would typically involve querying API keys from database
      const apiKeys = [
        {
          id: 'key_1',
          name: 'Production API Key',
          key: 'sk_prod_****',
          permissions: ['read', 'write'],
          lastUsed: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ];

      return NextResponse.json(successResponse(apiKeys));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch API keys',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch API keys',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/enterprise/api-keys
 * Create API key (SUPER_ADMIN or TENANT_ADMIN)
 */
export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();

      logger.info({
        message: 'API key created',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement API key creation
      // This would typically involve creating API key in database
      const newApiKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        key: `sk_${Math.random().toString(36).substring(2, 15)}`,
        permissions: body.permissions || ['read'],
        createdAt: new Date().toISOString()
      };

      return NextResponse.json(successResponse(newApiKey), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create API key',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create API key',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);