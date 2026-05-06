import { NextResponse } from 'next/server';
import { globalPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthStatus: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
      database: { status: 'up' | 'down'; latencyMs?: number; error?: string };
      stripe: { status: 'up' | 'down'; mode?: string; error?: string };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'up' },
      stripe: { status: 'up' },
    },
  };

  // 1. Check database connectivity and latency
  const dbStart = Date.now();
  try {
    await globalPrisma.$queryRaw`SELECT 1`;
    healthStatus.services.database.latencyMs = Date.now() - dbStart;
  } catch (err: any) {
    healthStatus.status = 'unhealthy';
    healthStatus.services.database.status = 'down';
    healthStatus.services.database.error = err.message || String(err);
    logger.error({ message: 'Health check failed: Database connection down', error: err });
  }

  // 2. Check Stripe connectivity status
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-04-10' as any,
      });
      const balance = await stripe.balance.retrieve();
      healthStatus.services.stripe.mode = balance.livemode ? 'live' : 'test';
    } else {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
  } catch (err: any) {
    // Note: Stripe service failure should not report entire app as unhealthy, but register status down
    healthStatus.services.stripe.status = 'down';
    healthStatus.services.stripe.error = err.message || String(err);
    logger.warn({ message: 'Health check warning: Stripe integration degraded', error: err });
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 500;
  return NextResponse.json(healthStatus, { status: statusCode });
}
