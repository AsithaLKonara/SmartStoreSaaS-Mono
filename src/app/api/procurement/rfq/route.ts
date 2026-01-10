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
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/procurement/rfq
 * Get RFQs
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const rfqs = await prisma.rFQ.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'RFQs fetched',
        context: {
          userId: user.id,
          organizationId,
          count: rfqs.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(rfqs));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch RFQs',
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
        message: 'Failed to fetch RFQs',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/procurement/rfq
 * Create RFQ
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { title, items, suppliers, deadline } = body;

      if (!title || !items) {
        throw new ValidationError('Title and items are required', {
          fields: { title: !title, items: !items }
        });
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
        context: {
          userId: user.id,
          organizationId,
          rfqId: rfq.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(rfq), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create RFQ',
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
        message: 'Failed to create RFQ',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

