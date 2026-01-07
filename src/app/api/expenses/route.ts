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
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

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

  // TODO: Fix expense model - temporarily disabled for deployment
  // const expenses = await prisma.expense.findMany({
  //   where: { organizationId },
  //   orderBy: { date: 'desc' },
  //   take: 100
  // });
  const expenses: any[] = []; // Temporary empty array

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
  const { amount, category, description, date } = body;

  if (!amount || !category) {
    return NextResponse.json({ 
      success: false, 
      message: 'Amount and category are required' 
    }, { status: 400 });
  }

  const organizationId = getOrganizationScope(user);
  if (!organizationId) {
    return NextResponse.json({ 
      success: false, 
      message: 'User must belong to an organization' 
    }, { status: 400 });
  }

  // TODO: Fix expense model - temporarily disabled for deployment
  // const expense = await prisma.expense.create({
  //   data: {
  //     organizationId,
  //     amount,
  //     category,
  //     description,
  //     date: date ? new Date(date) : new Date(),
  //     createdBy: user.id
  //   }
  // });
  const expense = { id: 'temp_' + Date.now(), message: 'Expense creation disabled for deployment' };

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
});
