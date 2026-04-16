/**
 * Customer Insights Analytics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CUSTOMER_INSIGHTS permission)
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
 * GET /api/analytics/customer-insights
 * Get customer insights
 */
export const GET = requirePermission(Permission.ANALYTICS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const [totalCustomers, customerOrders] = await Promise.all([
        prisma.customer.count({ where: { organizationId } }),
        prisma.order.groupBy({
          by: ['customerId'],
          _count: { id: true },
          _sum: { total: true },
          where: { organizationId }
        })
      ]);

      const activeCustomers = customerOrders.length;
      let totalValue = 0;
      
      const customerStats = customerOrders.map(c => {
        const val = Number(c._sum.total || 0);
        totalValue += val;
        return {
          customerId: c.customerId,
          orders: c._count.id,
          totalValue: val
        };
      }).sort((a, b) => b.totalValue - a.totalValue);

      const topCustomers = await prisma.customer.findMany({
        where: { id: { in: customerStats.slice(0, 5).map(c => c.customerId) } },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      const topCustomersData = topCustomers.map(c => {
        const stats = customerStats.find(s => s.customerId === c.id);
        return { ...c, ...stats };
      }).sort((a: any, b: any) => b.totalValue - a.totalValue);

      const customerLifetimeValue = activeCustomers > 0 ? totalValue / activeCustomers : 0;
      
      logger.info({
        message: 'Customer insights fetched',
        context: { userId: user.id, organizationId },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        totalCustomers,
        activeCustomers,
        topCustomers: topCustomersData,
        churnRate: 0, // Would need historical data to calculate accurately
        customerLifetimeValue: Number(customerLifetimeValue.toFixed(2))
      }));
    } catch (error: any) {
      logger.error({
        message: 'Customer insights fetch failed',
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
        message: 'Customer insights fetch failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

