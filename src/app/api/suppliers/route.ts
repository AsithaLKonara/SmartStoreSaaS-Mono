import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { successResponse, AppError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { withErrorHandlerApp } from '@/lib/middleware/withErrorHandlerApp';

export const GET = withErrorHandlerApp(
  requirePermission('VIEW_SUPPLIERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new AppError('Organization ID not found for user', 'ERR_MISSING_ORG_ID', 400);
        }

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.supplier.count({
      where: { organizationId }
    });

        logger.info({
          message: 'Suppliers fetched',
          context: {
            count: suppliers.length,
            page,
            limit,
            organizationId,
            userId: user.id
          },
          correlation: req.correlationId
        });

        return NextResponse.json(
          successResponse({ suppliers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
        );
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch suppliers',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            organizationId: user.organizationId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        throw error;
      }
    }
  )
);

export const POST = withErrorHandlerApp(
  requirePermission('MANAGE_SUPPLIERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new AppError('Organization ID not found for user', 'ERR_MISSING_ORG_ID', 400);
        }

        const supplier = await prisma.supplier.create({
          data: {
            ...body,
            organizationId
          }
        });

        logger.info({
          message: 'Supplier created',
          context: {
            supplierId: supplier.id,
            organizationId,
            userId: user.id
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(supplier), { status: 201 });
      } catch (error: any) {
        logger.error({
          message: 'Failed to create supplier',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            organizationId: user.organizationId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        throw error;
      }
    }
  )
);
