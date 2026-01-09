/**
 * Procurement Suppliers API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPLIERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/procurement/suppliers
 * Get suppliers
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const suppliers = await prisma.supplier.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'Procurement suppliers fetched',
        context: {
          userId: user.id,
          organizationId,
          count: suppliers.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(suppliers));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement suppliers',
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
        message: 'Failed to fetch procurement suppliers',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/procurement/suppliers
 * Create supplier
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, contactName, email, phone } = body;

      if (!name) {
        throw new ValidationError('Supplier name is required', {
          fields: { name: !name }
        });
      }

      // Generate a unique supplier code
      const baseCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      let code = baseCode;
      let counter = 1;

      while (await prisma.supplier.findUnique({
        where: { organizationId_code: { organizationId, code } }
      })) {
        code = `${baseCode}${counter}`;
        counter++;
      }

      const supplier = await prisma.supplier.create({
        data: {
          organizationId,
          code,
          name,
          contactName,
          email,
          phone
        }
      });

      logger.info({
        message: 'Procurement supplier created',
        context: {
          userId: user.id,
          organizationId,
          supplierId: supplier.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(supplier), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create procurement supplier',
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
        message: 'Failed to create procurement supplier',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

