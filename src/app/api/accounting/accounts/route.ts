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
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/accounts
 * List accounting accounts with organization scoping
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Additional check for STAFF role - must be accountant
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Only accountant staff can view accounts',
          correlation: req.correlationId || 'unknown'
        }, { status: 403 });
      }

      // Get organization scoping
      const orgId = getOrganizationScope(user);

      const accounts = await prisma.chart_of_accounts.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { code: 'asc' }
      });

      logger.info({
        message: 'Accounting accounts fetched',
        context: {
          userId: user.id,
          count: accounts.length,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(accounts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch accounting accounts',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch accounting accounts',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/accounting/accounts
 * Create accounting account with organization scoping
 */
export const POST = requirePermission('MANAGE_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { code, name, type, category } = body;

      // Validation
      if (!code || !name || !type) {
        throw new ValidationError('Code, name, and type are required', {
          fields: { code: !code, name: !name, type: !type }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const account = await prisma.chart_of_accounts.create({
        data: {
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          code,
          name,
          accountType: type,
          accountSubType: category,
          balance: 0,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Accounting account created',
        context: {
          userId: user.id,
          accountId: account.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(account), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create accounting account',
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
        message: 'Failed to create accounting account',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
