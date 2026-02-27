import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit';
import * as crypto from 'crypto';

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

      // Fetch actual API keys from database
      const apiKeys = await prisma.apiKey.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(successResponse(apiKeys));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch API keys',
        error: error instanceof Error ? error.message : String(error),
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
      const { name, permissions, expiresAt } = body;

      if (!name) {
        throw new ValidationError('Name is required for API key');
      }

      logger.info({
        message: 'API key creation requested',
        context: {
          userId: user.id,
          organizationId,
          name
        },
        correlation: req.correlationId
      });

      // Generate a secure API key
      const keyPrefix = 'sk_';
      const keyBuffer = crypto.randomBytes(24);
      const fullKey = `${keyPrefix}${keyBuffer.toString('hex')}`;

      // Create API key in database
      const newApiKey = await prisma.apiKey.create({
        data: {
          name,
          key: fullKey,
          organizationId: organizationId as string,
          userId: user.id,
          isActive: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          permissions: permissions || []
        }
      });

      // Audit log the creation
      await AuditService.log({
        userId: user.id,
        organizationId,
        action: 'CREATE_API_KEY',
        resource: 'API_KEY',
        resourceId: newApiKey.id,
        details: { name }
      });

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