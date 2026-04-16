/**
 * Shipping Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SHIPPING_STATS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

import { prisma } from '@/lib/prisma';

export const GET = requirePermission(Permission.INVENTORY_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Aggregate delivery statistics
      const [totalCount, statusGroups] = await Promise.all([
        prisma.delivery.count({
          where: { organizationId }
        }),
        prisma.delivery.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { id: true }
        })
      ]);

      const statsMap = statusGroups.reduce((acc, group) => {
        acc[group.status] = group._count.id;
        return acc;
      }, {} as Record<string, number>);

      logger.info({
        message: 'Shipping statistics generated successfully',
        context: { userId: user.id, organizationId, totalCount }
      });

      return NextResponse.json(successResponse({
        totalShipments: totalCount,
        inTransit: statsMap['SHIPPED'] || 0,
        delivered: statsMap['DELIVERED'] || 0,
        pending: statsMap['PENDING'] || 0,
        cancelled: statsMap['CANCELLED'] || 0,
        avgDeliveryTime: 0 // Logic for this depends on tracking actualDelivery vs createdAt
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch shipping statistics',
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
        message: 'Failed to fetch shipping statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

