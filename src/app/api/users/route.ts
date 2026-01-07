/**
 * Users API Route
 * 
 * Handles user management operations
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_USERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_USERS permission)
 * 
 * Organization Scoping:
 * - TENANT_ADMIN sees only their organization's users
 * - SUPER_ADMIN can see all users across organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * List users with organization scoping
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // SUPER_ADMIN can see all users, TENANT_ADMIN sees only their organization
    const orgId = getOrganizationScope(user);
    const where = orgId ? { organizationId: orgId } : {};

    // Query users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleTag: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    logger.info({
      message: 'Users fetched',
      context: {
        count: users.length,
        page,
        limit,
        organizationId: orgId,
        userRole: user.role
      },
      correlation: req.correlationId
    });

    return NextResponse.json(
      successResponse(users, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    );
  }
);

/**
 * POST /api/users
 * Create new user with proper authorization
 */
export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    const body = await req.json();
    const { name, email, password, role, roleTag, organizationId: requestedOrgId } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required',
        fields: { email: !email, password: !password }
      }, { status: 400 });
    }

    // Role validation - Only SUPER_ADMIN can create SUPER_ADMIN users
    if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only SUPER_ADMIN can create SUPER_ADMIN users' 
      }, { status: 403 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine organization - SUPER_ADMIN can create users for any org, others create for their own
    const organizationId = user.role === 'SUPER_ADMIN' 
      ? requestedOrgId || user.organizationId
      : getOrganizationScope(user);

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Organization ID is required' 
      }, { status: 400 });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'TENANT_ADMIN',
        roleTag,
        organizationId,
        isActive: true,
        emailVerified: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleTag: true,
        organizationId: true,
        isActive: true,
        createdAt: true
      }
    });

    logger.info({
      message: 'User created',
      context: {
        newUserId: newUser.id,
        newUserRole: newUser.role,
        organizationId: newUser.organizationId,
        createdBy: user.id
      },
      correlation: req.correlationId
    });

    return NextResponse.json(
      successResponse(newUser),
      { status: 201 }
    );
  }
);
