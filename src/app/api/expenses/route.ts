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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(async (req: AuthenticatedRequest, user) => {
  // Check role and roleTag - SUPER_ADMIN, TENANT_ADMIN, or STAFF with accountant roleTag
  if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(user.role)) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }

  if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
    return NextResponse.json({ 
      success: false, 
      message: 'Only accountant staff can view expenses' 
    }, { status: 403 });
  }

  const organizationId = getOrganizationScope(user);
  if (!organizationId) {
    return NextResponse.json({ 
      success: false, 
      message: 'User must belong to an organization' 
    }, { status: 400 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    logger.info({
      message: 'Expenses fetched',
      context: { 
        count: expenses.length,
        organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });

    return NextResponse.json(successResponse(expenses));
  } catch (error) {
    logger.error({
      message: 'Failed to fetch expenses',
      error: error instanceof Error ? error : new Error(String(error)),
      correlation: req.correlationId
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch expenses' }, { status: 500 });
  }
});

export const POST = requireAuth(async (req: AuthenticatedRequest, user) => {
  // Check role and roleTag - SUPER_ADMIN, TENANT_ADMIN, or STAFF with accountant roleTag
  if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(user.role)) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }

  if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
    return NextResponse.json({ 
      success: false, 
      message: 'Only accountant staff can create expenses' 
    }, { status: 403 });
  }

  const body = await req.json();
  const { title, amount, category, description, date, type } = body;

  if (!title || !amount || !category) {
    return NextResponse.json({ 
      success: false, 
      message: 'Title, amount and category are required' 
    }, { status: 400 });
  }

  const organizationId = getOrganizationScope(user);
  if (!organizationId) {
    return NextResponse.json({ 
      success: false, 
      message: 'User must belong to an organization' 
    }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        id: `exp_${Date.now()}`,
        organizationId,
        title,
        amount: parseFloat(amount),
        category,
        type: type || 'OTHER',
        description,
        createdAt: date ? new Date(date) : new Date(),
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Expense created',
      context: { 
        expenseId: expense.id, 
        amount,
        organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });

    return NextResponse.json(successResponse(expense), { status: 201 });
  } catch (error) {
    logger.error({
      message: 'Failed to create expense',
      error: error instanceof Error ? error : new Error(String(error)),
      correlation: req.correlationId
    });
    return NextResponse.json({ success: false, message: 'Failed to create expense' }, { status: 500 });
  }
});
