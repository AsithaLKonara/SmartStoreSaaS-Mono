/**
 * Accounting Accounts List API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view accounts');
      }

      const orgId = getOrganizationScope(user);

      const accounts = await prisma.account.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { code: 'asc' }
      });

      logger.info({
        message: 'Accounting accounts fetched',
        context: { userId: user.id, count: accounts.length }
      });

      return NextResponse.json(successResponse(accounts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch accounting accounts',
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
      const { code, name, type, category } = body;

      if (!code || !name || !type) {
        throw new ValidationError('Code, name, and type are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const account = await prisma.account.create({
        data: {
          organizationId,
          code,
          name,
          type,
          category,
          balance: 0
        }
      });

      logger.info({
        message: 'Accounting account created',
        context: { userId: user.id, accountId: account.id }
      });

      return NextResponse.json(successResponse(account), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create accounting account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
