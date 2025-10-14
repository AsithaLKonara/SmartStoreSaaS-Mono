/**
 * Invoice QR Code API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_INVOICES permission)
 * 
 * Organization Scoping: Validated through invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const invoiceId = params.id;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new ValidationError('Invoice not found');
      }

      if (invoice.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot generate QR for invoices from other organizations');
      }

      logger.info({
        message: 'Invoice QR code generated',
        context: { userId: user.id, invoiceId }
      });

      // TODO: Generate actual QR code
      return NextResponse.json(successResponse({
        qrCodeUrl: `/qr/invoice_${invoiceId}.png`,
        invoiceId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Invoice QR generation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
