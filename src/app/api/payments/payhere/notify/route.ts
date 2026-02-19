/**
 * PayHere Payment Notification Route
 * 
 * Authorization:
 * - POST: Public (PayHere webhook callback)
 * 
 * Handles PayHere payment notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';
import { payHereService } from '@/lib/payments/payhereService';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { order_id, payment_id, status_code } = body;

      logger.info({
        message: 'PayHere notification received',
        context: {
          orderId: order_id,
          paymentId: payment_id,
          statusCode: status_code
        }
      });

      // Process notification (validates signature and updates DB)
      const result = await payHereService.processNotification(body);

      return NextResponse.json(successResponse({
        received: true,
        status: result.status,
        orderId: order_id
      }));

    } catch (error: any) {
      logger.error({
        message: 'PayHere notification processing failed',
        error: error
      });
      throw error;
    }
  }
);
