/**
 * Billing Dashboard API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_BILLING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/dashboard
 * Get billing dashboard data
 */
export const GET = requirePermission(Permission.BILLING_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const [invoices, outstanding] = await Promise.all([
        prisma.invoice.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.invoice.aggregate({
          where: { organizationId, status: { in: ['DRAFT', 'PENDING'] } },
          _sum: { total: true }
        })
      ]);

      logger.info({
        message: 'Billing dashboard requested',
        context: { userId: user.id, organizationId },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        currentPlan: 'PRO', // In real system, query subscriptions table
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        outstandingBalance: Number(outstanding._sum.total || 0),
        recentInvoices: invoices
      }));
    } catch (error: any) {
      logger.error({
        message: 'Billing dashboard fetch failed',
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
        message: 'Billing dashboard fetch failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
