/**
 * HR Employees API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_EMPLOYEES permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_EMPLOYEES permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hr/employees
 * Get employees (SUPER_ADMIN or TENANT_ADMIN)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const orgId = getOrganizationScope(user);
      if (!orgId) {
        throw new ValidationError('User must belong to an organization');
      }

      const employees = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          role: { in: ['STAFF', 'TENANT_ADMIN'] }, // Only get staff and admin users
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleTag: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Employees fetched',
        context: {
          userId: user.id,
          organizationId: orgId,
          count: employees.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(employees));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch employees',
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
        message: 'Failed to fetch employees',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/hr/employees
 * Create employee (SUPER_ADMIN or TENANT_ADMIN)
 */
export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, email, position, department } = body;

      if (!name || !email) {
        throw new ValidationError('Name and email are required', {
          fields: { name: !name, email: !email }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const employee = await prisma.user.create({
        data: {
          organizationId,
          name,
          email,
          role: 'STAFF',
          roleTag: position, // Store position in roleTag field
          phone: department, // Store department in phone field (not ideal but reusing existing fields)
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleTag: true,
          phone: true,
          createdAt: true
        }
      });

      logger.info({
        message: 'Employee created',
        context: {
          userId: user.id,
          organizationId,
          employeeId: employee.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(employee), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create employee',
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
        message: 'Failed to create employee',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

