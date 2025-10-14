/**
 * Single Accounting Account API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Validated through account
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view accounts');
      }

      const accountId = params.id;

      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new ValidationError('Account not found');
      }

      if (account.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view accounts from other organizations');
      }

      logger.info({
        message: 'Accounting account fetched',
        context: { userId: user.id, accountId }
      });

      return NextResponse.json(successResponse(account));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch accounting account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const accountId = params.id;
      const body = await request.json();

      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new ValidationError('Account not found');
      }

      if (account.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update accounts from other organizations');
      }

      const updated = await prisma.account.update({
        where: { id: accountId },
        data: body
      });

      logger.info({
        message: 'Accounting account updated',
        context: { userId: user.id, accountId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update accounting account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const accountId = params.id;

      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new ValidationError('Account not found');
      }

      if (account.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete accounts from other organizations');
      }

      await prisma.account.delete({
        where: { id: accountId }
      });

      logger.info({
        message: 'Accounting account deleted',
        context: { userId: user.id, accountId }
      });

      return NextResponse.json(successResponse({
        message: 'Account deleted',
        accountId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete accounting account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
