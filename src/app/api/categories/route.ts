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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    // TODO: Add organization scoping
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId,
        isActive: true
      }
    });

    logger.info({
      message: 'Category created',
      context: { categoryId: category.id }
    });

    return NextResponse.json(successResponse(category), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create category',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
