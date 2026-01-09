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
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/accounts/[id]
 * Get single accounting account with organization scoping
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const accountId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_ACCOUNTING')(
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

        const account = await prisma.chart_of_accounts.findUnique({
          where: { id: accountId }
        });

        if (!account) {
          throw new NotFoundError('Account not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, account.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot view accounts from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        logger.info({
          message: 'Accounting account fetched',
          context: {
            userId: user.id,
            accountId,
            organizationId: account.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(account));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch accounting account',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch accounting account',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * PUT /api/accounting/accounts/[id]
 * Update accounting account with organization scoping
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const accountId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_ACCOUNTING')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();

        const account = await prisma.chart_of_accounts.findUnique({
          where: { id: accountId }
        });

        if (!account) {
          throw new NotFoundError('Account not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, account.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot update accounts from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        const updated = await prisma.chart_of_accounts.update({
          where: { id: accountId },
          data: body
        });

        logger.info({
          message: 'Accounting account updated',
          context: {
            userId: user.id,
            accountId,
            organizationId: account.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(updated));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update accounting account',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update accounting account',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * DELETE /api/accounting/accounts/[id]
 * Delete accounting account with organization scoping
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const accountId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_ACCOUNTING')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const account = await prisma.chart_of_accounts.findUnique({
          where: { id: accountId }
        });

        if (!account) {
          throw new NotFoundError('Account not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, account.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot delete accounts from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        await prisma.chart_of_accounts.delete({
          where: { id: accountId }
        });

        logger.info({
          message: 'Accounting account deleted',
          context: {
            userId: user.id,
            accountId,
            organizationId: account.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Account deleted',
          accountId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to delete accounting account',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to delete accounting account',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}
