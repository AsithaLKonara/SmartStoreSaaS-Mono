/**
 * Request for Quotation (RFQ) API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_PROCUREMENT permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_PROCUREMENT permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const rfqs = await prisma.rFQ.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'RFQs fetched',
        context: { userId: user.id, count: rfqs.length }
      });

      return NextResponse.json(successResponse(rfqs));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch RFQs',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { title, items, suppliers, deadline } = body;

      if (!title || !items) {
        throw new ValidationError('Title and items are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const rfq = await prisma.rFQ.create({
        data: {
          organizationId,
          title,
          items,
          suppliers,
          deadline: deadline ? new Date(deadline) : undefined,
          status: 'DRAFT',
          createdBy: user.id
        }
      });

      logger.info({
        message: 'RFQ created',
        context: { userId: user.id, rfqId: rfq.id }
      });

      return NextResponse.json(successResponse(rfq), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create RFQ',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

