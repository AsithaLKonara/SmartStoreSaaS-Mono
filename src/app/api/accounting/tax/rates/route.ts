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
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view tax rates');
      }

      const orgId = getOrganizationScope(user);

      const taxRates = await prisma.tax_rates.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { code: 'asc' }
      });

      logger.info({
        message: 'Tax rates fetched',
        context: { userId: user.id, count: taxRates.length }
      });

      return NextResponse.json(successResponse(taxRates));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch tax rates',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, code, rate, taxType, jurisdiction } = body;

      if (!name || !code || rate === undefined) {
        throw new ValidationError('Name, code, and rate are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const taxRate = await prisma.tax_rates.create({
        data: {
          organizationId,
          name,
          code,
          rate,
          taxType: taxType || 'VAT',
          jurisdiction,
          effectiveFrom: new Date(),
          isCompound: false
        }
      });

      logger.info({
        message: 'Tax rate created',
        context: { userId: user.id, taxRateId: taxRate.id, code }
      });

      return NextResponse.json(successResponse(taxRate), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create tax rate',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
