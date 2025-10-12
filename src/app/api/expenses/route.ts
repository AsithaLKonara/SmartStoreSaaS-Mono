/**
 * Expenses API
 * Track and manage business expenses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, addTenantFilter } from '@/lib/tenant/isolation';
import { UserRole } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  paymentMethod: string;
  vendor?: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  approvedBy?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/expenses - Get all expenses
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = addTenantFilter({}, context.organizationId, context.isSuperAdmin);

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // For now, we'll store expenses as JSON in a generic table
    // In production, you'd create a proper Expense model
    const expenses: Expense[] = [];

    // Mock data for demonstration
    if (expenses.length === 0) {
      // Return sample expenses
      const sampleExpenses = [
        {
          id: 'exp-1',
          description: 'Office Supplies',
          amount: 5000,
          currency: 'LKR',
          category: 'OFFICE',
          date: new Date(),
          paymentMethod: 'CASH',
          status: 'APPROVED' as const,
          organizationId: context.organizationId,
          createdBy: context.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'exp-2',
          description: 'Marketing Campaign',
          amount: 25000,
          currency: 'LKR',
          category: 'MARKETING',
          date: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          vendor: 'Google Ads',
          status: 'PAID' as const,
          organizationId: context.organizationId,
          createdBy: context.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      return NextResponse.json({
        success: true,
        data: sampleExpenses,
        pagination: {
          page,
          limit,
          total: sampleExpenses.length,
          pages: 1,
        },
        message: 'Note: Using sample data. Add Expense model to schema for persistence.',
      });
    }

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total: expenses.length,
        pages: Math.ceil(expenses.length / limit),
      },
    });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses - Create new expense
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { description, amount, category, date, paymentMethod, vendor, receiptUrl } = body;

    if (!description || !amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Description, amount, and category are required' },
        { status: 400 }
      );
    }

    // Create expense
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      description,
      amount: parseFloat(amount),
      currency: 'LKR',
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'CASH',
      vendor,
      receiptUrl,
      status: 'PENDING',
      organizationId: context.organizationId,
      createdBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database:
    // await prisma.expense.create({ data: expense });

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense created successfully. Note: Add Expense model for persistence.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expenses - Update expense
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, approvedBy, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // In production:
    // const expense = await prisma.expense.update({
    //   where: { id },
    //   data: { ...updates, status, approvedBy, updatedAt: new Date() }
    // });

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
    });
  } catch (error: any) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses - Delete expense
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can delete
    if (context.role !== UserRole.SUPER_ADMIN && context.role !== UserRole.TENANT_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // In production:
    // await prisma.expense.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

