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
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { withErrorHandler, successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * List users with organization scoping
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      // Organization scoping
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
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
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
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

/**
 * POST /api/users
 * Create new user with proper authorization
 */
export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, email, password, role, roleTag } = body;

      // Validation
      if (!email || !password) {
        throw new ValidationError('Email and password are required', {
          fields: { email: !email, password: !password }
        });
      }

      // Role validation
      if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new AuthorizationError('Only SUPER_ADMIN can create SUPER_ADMIN users');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine organization
      // SUPER_ADMIN can create users for any org, others create for their own
      const organizationId = user.role === 'SUPER_ADMIN' 
        ? body.organizationId || user.organizationId
        : user.organizationId;

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
          createdBy: user.id,
          createdByRole: user.role,
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
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);
