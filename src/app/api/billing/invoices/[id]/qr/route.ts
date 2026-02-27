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
import { successResponse, ValidationError, AppError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/invoices/[id]/qr
 * Generate invoice QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const invoiceId = resolvedParams.id;

  const handler = requirePermission('VIEW_BILLING')(
    async (req: AuthenticatedRequest, user) => {
      try {

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId }
        });

        if (!invoice) {
          throw new AppError('Invoice not found', 'ERR_NOT_FOUND', 404);
        }

        if (invoice.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          throw new AppError('Cannot generate QR for invoices from other organizations', 'ERR_FORBIDDEN', 403);
        }

        // Generate QR code content (e.g., payment URL)
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const paymentUrl = `${baseUrl}/billing/invoices/${invoiceId}/pay`;

        // Generate QR Code as Data URL
        const qrCodeUrl = await QRCode.toDataURL(paymentUrl);

        logger.info({
          message: 'Invoice QR code generated',
          context: {
            invoiceId,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          qrCodeUrl, // This is a data:image/png;base64 string
          invoiceId,
          paymentUrl
        }));
      } catch (error: any) {
        logger.error({
          message: 'Invoice QR generation failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            invoiceId
          },
          correlation: correlationId
        });

        if (error instanceof ValidationError || error instanceof AppError) {
          throw error;
        }

        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Invoice QR generation failed',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}
