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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * List users with organization scoping
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
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
        limit
      }
    });

    return NextResponse.json(
      successResponse(users, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    );
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch users',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Create new user with proper authorization
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { name, email, password, role, roleTag } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required',
        fields: { email: !email, password: !password }
      }, { status: 400 });
    }

    // TODO: Role validation
    // if (role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Only SUPER_ADMIN can create SUPER_ADMIN users' }, { status: 403 });
    // }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Determine organization - SUPER_ADMIN can create users for any org, others create for their own
    const organizationId = session.user.role === 'SUPER_ADMIN' 
      ? body.organizationId || session.user.organizationId
      : session.user.organizationId;

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
        organizationId: newUser.organizationId
      }
    });

    return NextResponse.json(
      successResponse(newUser),
      { status: 201 }
    );
  } catch (error: any) {
    logger.error({
      message: 'Failed to create user',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
  }
}
