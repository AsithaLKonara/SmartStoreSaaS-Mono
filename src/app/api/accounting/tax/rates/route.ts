/**
 * Tax Rates API Route
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
 * GET /api/accounting/tax/rates
 * List tax rates with organization scoping
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Additional check for STAFF role - must be accountant
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Only accountant staff can view tax rates',
          correlation: req.correlationId || 'unknown'
        }, { status: 403 });
      }

      // Get organization scoping
      const orgId = getOrganizationScope(user);

      const taxRates = await prisma.tax_rates.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { code: 'asc' }
      });

      logger.info({
        message: 'Tax rates fetched',
        context: {
          userId: user.id,
          count: taxRates.length,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(taxRates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch tax rates',
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
        message: 'Failed to fetch tax rates',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/accounting/tax/rates
 * Create tax rate with organization scoping
 */
export const POST = requirePermission('MANAGE_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { name, code, rate, taxType, jurisdiction } = body;

      // Validation
      if (!name || !code || rate === undefined) {
        throw new ValidationError('Name, code, and rate are required', {
          fields: { name: !name, code: !code, rate: rate === undefined }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const taxRate = await prisma.tax_rates.create({
        data: {
          id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          name,
          code,
          rate,
          taxType: taxType || 'VAT',
          jurisdiction,
          effectiveFrom: new Date(),
          isCompound: false,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Tax rate created',
        context: {
          userId: user.id,
          taxRateId: taxRate.id,
          code,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(taxRate), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create tax rate',
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
        message: 'Failed to create tax rate',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
