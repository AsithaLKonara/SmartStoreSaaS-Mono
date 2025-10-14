/**
 * Enterprise API Keys Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_API_KEYS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_API_KEYS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const apiKeys = await prisma.apiKey.findMany({
        where: orgId ? { organizationId: orgId } : {},
        select: {
          id: true,
          name: true,
          lastUsed: true,
          createdAt: true,
          expiresAt: true,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'API keys fetched',
        context: { userId: user.id, count: apiKeys.length }
      });

      return NextResponse.json(successResponse(apiKeys));
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
      const { name, expiresIn } = body;

      if (!name) {
        throw new ValidationError('Name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // TODO: Generate actual API key
      const key = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const apiKey = await prisma.apiKey.create({
        data: {
          organizationId,
          name,
          key,
          createdBy: user.id,
          isActive: true
        }
      });

      logger.info({
        message: 'API key created',
        context: { userId: user.id, apiKeyId: apiKey.id }
      });

      return NextResponse.json(successResponse({
        ...apiKey,
        key // Only returned once at creation
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
