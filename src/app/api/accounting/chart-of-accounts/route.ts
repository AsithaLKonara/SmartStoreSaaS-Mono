/**
 * Chart of Accounts API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/chart-of-accounts
 * List chart of accounts with organization scoping
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Additional check for STAFF role - must be accountant
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Only accountant staff can view chart of accounts',
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
        message: 'Chart of accounts fetched',
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
        message: 'Failed to fetch chart of accounts',
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
        message: 'Failed to fetch chart of accounts',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/accounting/chart-of-accounts
 * Create chart of accounts entry with organization scoping
 */
export const POST = requirePermission('MANAGE_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { code, name, accountType, accountSubType } = body;

      // Validation
      if (!code || !name || !accountType) {
        return NextResponse.json({
          success: false,
          code: 'ERR_VALIDATION',
          message: 'Code, name, and account type are required',
          correlation: req.correlationId || 'unknown',
          details: {
            fields: { code: !code, name: !name, accountType: !accountType }
          }
        }, { status: 400 });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        return NextResponse.json({
          success: false,
          code: 'ERR_VALIDATION',
          message: 'User must belong to an organization',
          correlation: req.correlationId || 'unknown'
        }, { status: 400 });
      }

      const account = await prisma.chart_of_accounts.create({
        data: {
          id: `coa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          code,
          name,
          accountType,
          accountSubType,
          balance: 0,
          currency: 'USD',
          taxEnabled: false,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Account created',
        context: {
          userId: user.id,
          accountId: account.id,
          code,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(account), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create account',
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
        message: 'Failed to create account',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
