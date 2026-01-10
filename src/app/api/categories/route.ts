/**
 * Categories API Route
 * 
 * Authorization:
 * - GET: Public (anyone can view categories)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PRODUCTS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PRODUCTS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PRODUCTS permission)
 * 
 * Organization Scoping: Required for write operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories
 * Get categories (public or VIEW_PRODUCTS permission)
 */
export const GET = requirePermission('VIEW_PRODUCTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeChildren = searchParams.get('includeChildren') === 'true';
      const parentId = searchParams.get('parentId');

      const where: any = { isActive: true };

      if (parentId) {
        where.parentId = parentId;
      } else if (!includeChildren) {
        where.parentId = null;
      }

      const categories = await prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
              other_categories: true
            }
          },
          ...(includeChildren && {
            other_categories: {
              where: { isActive: true },
              include: {
                _count: { select: { products: true } }
              }
            }
          })
        },
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Categories fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          count: categories.length,
          includeChildren
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(categories));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch categories',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/categories
 * Create category (MANAGE_PRODUCTS permission)
 */
export const POST = requirePermission('MANAGE_PRODUCTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, description, parentId } = body;

      if (!name) {
        throw new ValidationError('Category name is required', {
          fields: { name: !name }
        });
      }

      const category = await prisma.category.create({
        data: {
          name,
          description,
          parentId,
          isActive: true,
          organizationId
        }
      });

      logger.info({
        message: 'Category created',
        context: {
          userId: user.id,
          organizationId,
          categoryId: category.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(category), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create category',
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
        message: 'Failed to create category',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
