/**
 * Inventory Movement API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
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
 * GET /api/inventory/movement
 * Get inventory movements
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const movements = await prisma.inventoryMovement.findMany({
        where: {
          product: {
            organizationId
          }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              organizationId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Inventory movements fetched',
        context: {
          userId: user.id,
          count: movements.length,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(movements));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch inventory movements',
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
        message: 'Failed to fetch inventory movements',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/inventory/movement
 * Record inventory movement
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { productId, quantity, type, reason } = body;

      if (!productId || !quantity || !type) {
        throw new ValidationError('Product ID, quantity, and type are required', {
          fields: { productId: !productId, quantity: !quantity, type: !type }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Verify product belongs to organization
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ValidationError('Product not found');
      }

      if (product.organizationId !== organizationId) {
        throw new ValidationError('Cannot record movements for products from other organizations');
      }

      const movement = await prisma.inventoryMovement.create({
        data: {
          productId,
          quantity,
          type,
          reason,
          reference: `User: ${user.id}`
        }
      });

      logger.info({
        message: 'Inventory movement recorded',
        context: {
          userId: user.id,
          movementId: movement.id,
          productId,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(movement), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to record inventory movement',
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
        message: 'Failed to record inventory movement',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

