/**
 * Campaign Templates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CAMPAIGNS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CAMPAIGNS permission)
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

      const templates = await prisma.campaignTemplate.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Campaign templates fetched',
        context: { userId: user.id, count: templates.length }
      });

      return NextResponse.json(successResponse(templates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch campaign templates',
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
      const { name, content, type } = body;

      if (!name || !content) {
        throw new ValidationError('Name and content are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const template = await prisma.campaignTemplate.create({
        data: {
          organizationId,
          name,
          content,
          type: type || 'EMAIL'
        }
      });

      logger.info({
        message: 'Campaign template created',
        context: { userId: user.id, templateId: template.id }
      });

      return NextResponse.json(successResponse(template), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create campaign template',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
