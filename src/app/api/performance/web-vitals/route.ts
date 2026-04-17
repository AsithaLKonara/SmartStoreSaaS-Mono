/**
 * Web Vitals API Route
 * 
 * Authorization:
 * - POST: Public (collect web vitals from client)
 * 
 * Collects Core Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { metric, value, id, path } = body;

      logger.info({
        message: 'Web vital recorded',
        context: {
          metric,
          value,
          path
        }
      });

      // Persist the web vital to MonitoringMetric
      await prisma.monitoringMetric.create({
        data: {
          type: 'web_vital',
          name: metric || 'unknown',
          value: typeof value === 'number' ? value : parseFloat(String(value)) || 0,
          unit: 'ms',
          tags: { id, path },
        },
      });

      return NextResponse.json(successResponse({
        recorded: true,
        metric
      }));
    } catch (error: any) {
      logger.error({
        message: 'Web vital recording failed',
        error: error
      });
      throw error;
    }
  }
);
