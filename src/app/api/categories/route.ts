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
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET is public for browsing, but could be auth-required if needed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
      context: { count: categories.length, includeChildren }
    });

    return NextResponse.json(successResponse(categories));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch categories',
      error: error
    });
    throw error;
  }
}

export const POST = requirePermission('MANAGE_PRODUCTS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, description, parentId } = body;

      if (!name) {
        throw new ValidationError('Category name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const category = await prisma.category.create({
        data: {
          name,
          description,
          parentId,
          organizationId,
          isActive: true
        }
      });

      logger.info({
        message: 'Category created',
        context: { userId: user.id, categoryId: category.id }
      });

      return NextResponse.json(successResponse(category), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create category',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
