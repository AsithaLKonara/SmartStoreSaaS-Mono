import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/rbac/middleware';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }) => {
    try {
      const { id } = params;
      const orgId = getOrganizationScope(user);

      const shipment = await prisma.delivery.findUnique({
        where: { id },
        include: {
          order: true,
          courier: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!shipment || (orgId && shipment.organizationId !== orgId)) {
        throw new NotFoundError('Shipment not found');
      }

      logger.info({
        message: 'Shipment detail fetched',
        context: { userId: user.id, shipmentId: id }
      });

      return NextResponse.json(successResponse(shipment));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch shipment detail',
        error: error,
        context: { userId: user.id, shipmentId: params.id }
      });
      throw error;
    }
  }
);
