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
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tenants
 * List all organizations (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
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
          userId: user.id,
          count: tenants.length,
          page,
          limit
        },
        correlation: req.correlationId
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
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch organizations',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/tenants
 * Create new organization (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, domain, description, plan } = body;

      // Validation
      if (!name) {
        throw new ValidationError('Organization name is required', {
          fields: { name: !name }
        });
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
          userId: user.id,
          organizationId: organization.id,
          name: organization.name,
          plan: organization.plan
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(organization),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create organization',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create organization',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
