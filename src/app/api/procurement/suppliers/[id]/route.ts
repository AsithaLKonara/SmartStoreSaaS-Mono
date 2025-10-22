/**
 * Single Procurement Supplier API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPLIERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * 
 * Organization Scoping: Validated through supplier
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new ValidationError('Supplier not found');
      }

      if (supplier.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view suppliers from other organizations');
      }

      logger.info({
        message: 'Procurement supplier fetched',
        context: { userId: user.id, supplierId }
      });

      return NextResponse.json(successResponse(supplier));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement supplier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;
      const body = await request.json();

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new ValidationError('Supplier not found');
      }

      if (supplier.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update suppliers from other organizations');
      }

      const updated = await prisma.supplier.update({
        where: { id: supplierId },
        data: body
      });

      logger.info({
        message: 'Procurement supplier updated',
        context: { userId: user.id, supplierId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update procurement supplier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new ValidationError('Supplier not found');
      }

      if (supplier.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete suppliers from other organizations');
      }

      await prisma.supplier.delete({
        where: { id: supplierId }
      });

      logger.info({
        message: 'Procurement supplier deleted',
        context: { userId: user.id, supplierId }
      });

      return NextResponse.json(successResponse({
        message: 'Supplier deleted',
        supplierId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete procurement supplier',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

