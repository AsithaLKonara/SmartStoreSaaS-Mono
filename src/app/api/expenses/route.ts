/**
 * Expenses API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_EXPENSES permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (MANAGE_EXPENSES permission)
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
        throw new ValidationError('Only accountant staff can view expenses');
      }

      const orgId = getOrganizationScope(user);

      const expenses = await prisma.expense.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { date: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Expenses fetched',
        context: { userId: user.id, count: expenses.length }
      });

      return NextResponse.json(successResponse(expenses));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch expenses',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can create expenses');
      }

      const body = await request.json();
      const { amount, category, description, date } = body;

      if (!amount || !category) {
        throw new ValidationError('Amount and category are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const expense = await prisma.expense.create({
        data: {
          organizationId,
          amount,
          category,
          description,
          date: date ? new Date(date) : new Date(),
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Expense created',
        context: { userId: user.id, expenseId: expense.id, amount }
      });

      return NextResponse.json(successResponse(expense), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create expense',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
