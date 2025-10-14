/**
 * Global Search API Route
 * 
 * Authorization:
 * - GET: Requires authentication
 * - Searches only within user's organization
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || searchParams.get('query') || '';
      const type = searchParams.get('type'); // products, customers, orders

      if (!query) {
        throw new ValidationError('Search query is required');
      }

      // Organization scoping
      const orgId = getOrganizationScope(user);

      const results: any = {};

      // Search products
      if (!type || type === 'products') {
        results.products = await prisma.product.findMany({
          where: {
            ...(orgId && { organizationId: orgId }),
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { sku: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 10,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true
          }
        });
      }

      // Search customers (admin only)
      if ((!type || type === 'customers') && ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(user.role)) {
        results.customers = await prisma.customer.findMany({
          where: {
            ...(orgId && { organizationId: orgId }),
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });
      }

      // Search orders
      if (!type || type === 'orders') {
        const where: any = {
          ...(orgId && { organizationId: orgId }),
          orderNumber: { contains: query, mode: 'insensitive' }
        };

        // Customer can only search their own orders
        if (user.role === 'CUSTOMER') {
          const customer = await prisma.customer.findFirst({
            where: { email: user.email }
          });
          if (customer) {
            where.customerId = customer.id;
          }
        }

        results.orders = await prisma.order.findMany({
          where,
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true
          }
        });
      }

      logger.info({
        message: 'Search performed',
        context: {
          userId: user.id,
          query,
          type: type || 'all',
          resultsCount: Object.values(results).flat().length
        }
      });

      return NextResponse.json(successResponse(results));
    } catch (error: any) {
      logger.error({
        message: 'Search failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
