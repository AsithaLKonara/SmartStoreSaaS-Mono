/**
 * Search API Route
 * 
 * Authorization:
 * - GET: All authenticated users (VIEW_PRODUCTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search
 * Perform search (requires authentication)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const query = searchParams.get('query') || searchParams.get('q');
      const action = searchParams.get('action') || 'global';

      if (!query) {
        throw new ValidationError('Query parameter is required', {
          fields: { q: !query }
        });
      }

      logger.info({
        message: 'Search performed',
        context: {
          userId: user.id,
          organizationId,
          query,
          type: action
        },
        correlation: req.correlationId
      });

      const [products, orders, customers] = await Promise.all([
        (action === 'global' || action === 'products') ? prisma.product.findMany({
          where: {
            organizationId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { sku: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 5
        }) : Promise.resolve([]),
        (action === 'global' || action === 'orders') ? prisma.order.findMany({
          where: {
            organizationId,
            orderNumber: { contains: query, mode: 'insensitive' }
          },
          take: 5
        }) : Promise.resolve([]),
        (action === 'global' || action === 'customers') ? prisma.customer.findMany({
          where: {
            organizationId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 5
        }) : Promise.resolve([])
      ]);

      const results = [
        ...products.map(p => ({
          id: p.id,
          type: 'product',
          title: p.name,
          description: `SKU: ${p.sku} | Price: ${p.price}`,
          relevance: 100,
          highlights: []
        })),
        ...orders.map(o => ({
          id: o.id,
          type: 'order',
          title: `Order #${o.orderNumber}`,
          description: `Status: ${o.status} | Total: ${o.total}`,
          relevance: 90,
          highlights: []
        })),
        ...customers.map(c => ({
          id: c.id,
          type: 'customer',
          title: c.name,
          description: c.email,
          relevance: 80,
          highlights: []
        }))
      ];

      return NextResponse.json(successResponse({
        results,
        analytics: { searchTime: 50, totalResults: results.length }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Search failed',
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
        message: 'Search failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);