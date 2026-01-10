import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/currency/convert
 * Convert currency (requires authentication)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { amount, from, to } = body;

      if (!amount || !from || !to) {
        throw new ValidationError('Amount, from currency, and to currency are required', {
          fields: { amount: !amount, from: !from, to: !to }
        });
      }

      logger.info({
        message: 'Currency conversion requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          amount,
          from,
          to
        },
        correlation: req.correlationId
      });

      // TODO: Implement actual currency conversion
      // This would typically involve calling a currency API
      const convertedAmount = amount * 1.1; // Mock conversion rate

      return NextResponse.json(successResponse({
        originalAmount: amount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount,
        rate: 1.1
      }));
    } catch (error: any) {
      logger.error({
        message: 'Currency conversion failed',
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
        message: 'Currency conversion failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);