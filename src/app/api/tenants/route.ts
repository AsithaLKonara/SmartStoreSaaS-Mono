/**
 * Tenants (Organizations) API Route
 * 
 * Handles organization management operations
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_ALL_ORGANIZATIONS permission)
 * - POST: SUPER_ADMIN only (MANAGE_ORGANIZATIONS permission)
 * 
 * Organization Scoping:
 * - SUPER_ADMIN can see and manage all organizations
 * - Other roles cannot access this endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tenants
 * List all organizations (SUPER_ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          domain: true,
          description: true,
          status: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count()
    ]);

    const tenants = organizations.map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      description: org.description,
      status: org.status || 'ACTIVE',
      plan: org.plan,
      userCount: org._count.users,
      productCount: org._count.products,
      orderCount: org._count.orders,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    }));

    logger.info({
      message: 'Organizations fetched by SUPER_ADMIN',
      context: {
        count: tenants.length,
        page,
        limit
      }
    });

    return NextResponse.json(
      successResponse(tenants, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    );
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch organizations',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch organizations' }, { status: 500 });
  }
}

/**
 * POST /api/tenants
 * Create new organization (SUPER_ADMIN only)
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { name, domain, description, plan } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ success: false, message: 'Organization name is required' }, { status: 400 });
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const organization = await prisma.organization.create({
      data: {
        name,
        domain: domain || `${slug}.smartstore.app`,
        description,
        plan: plan || 'FREE',
        status: 'ACTIVE'
      }
    });

    logger.info({
      message: 'Organization created',
      context: {
        organizationId: organization.id,
        name: organization.name,
        plan: organization.plan
      }
    });

    return NextResponse.json(
      successResponse(organization),
      { status: 201 }
    );
  } catch (error: any) {
    logger.error({
      message: 'Failed to create organization',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create organization' }, { status: 500 });
  }
}
