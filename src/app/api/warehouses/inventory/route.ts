/**
 * Warehouse Inventory API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/warehouses/inventory
 * Get warehouse inventory
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Warehouse inventory requested',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // Fetch actual warehouse inventory using Prisma
      // Grouping movements might be complex, so we fetch warehouses with their movements
      const warehouses = await prisma.warehouse.findMany({
        where: { organizationId },
        include: {
          inventory: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            },
            take: 100, // Limit for performance
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return NextResponse.json(successResponse({
        warehouses,
        count: warehouses.length
      }));
    } catch (error: any) {

      logger.error({
        message: 'Failed to fetch warehouse inventory',
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
        message: 'Failed to fetch warehouse inventory',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);