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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const employees = await prisma.employee.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Employees fetched',
        context: { userId: user.id, count: employees.length }
      });

      return NextResponse.json(successResponse(employees));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch employees',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, email, position, department } = body;

      if (!name || !email) {
        throw new ValidationError('Name and email are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const employee = await prisma.employee.create({
        data: {
          organizationId,
          name,
          email,
          position,
          department,
          status: 'ACTIVE'
        }
      });

      logger.info({
        message: 'Employee created',
        context: { userId: user.id, employeeId: employee.id }
      });

      return NextResponse.json(successResponse(employee), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create employee',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

