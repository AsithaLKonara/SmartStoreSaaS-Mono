/**
 * Bank Accounts API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_BANK_ACCOUNTS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_BANK_ACCOUNTS permission)
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
        throw new ValidationError('Only accountant staff can view bank accounts');
      }

      const orgId = getOrganizationScope(user);

      const bankAccounts = await prisma.bankAccount.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { accountName: 'asc' }
      });

      logger.info({
        message: 'Bank accounts fetched',
        context: { userId: user.id, count: bankAccounts.length }
      });

      return NextResponse.json(successResponse(bankAccounts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch bank accounts',
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
      const { accountName, accountNumber, bankName, branch } = body;

      if (!accountName || !accountNumber || !bankName) {
        throw new ValidationError('Account name, number, and bank name are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const bankAccount = await prisma.bankAccount.create({
        data: {
          organizationId,
          accountName,
          accountNumber,
          bankName,
          branch,
          balance: 0,
          currency: 'USD'
        }
      });

      logger.info({
        message: 'Bank account created',
        context: { userId: user.id, bankAccountId: bankAccount.id }
      });

      return NextResponse.json(successResponse(bankAccount), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create bank account',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
