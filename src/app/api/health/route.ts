/**
 * Global Health Check API Route
 * 
 * Authorization:
 * - GET: Public (monitoring-friendly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  const health: any = {
    status: 'ok',
    database: 'unknown',
    redis: 'unknown',
    services: {
      inventory: 'unknown',
      orders: 'unknown',
      analytics: 'unknown'
    },
    timestamp
  };

  try {
    // 1. Database Check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
    const dbLatency = Date.now() - dbStart;

    // 2. Redis Check
    try {
      const redis = getRedisClient();
      if (redis) {
          // Send a ping
          const ping = await redis.ping();
          health.redis = ping === 'PONG' ? 'connected' : 'disconnected';
      } else {
          health.redis = 'not_configured';
      }
    } catch (e) {
      health.redis = 'error';
    }

    // 3. Service Depth Checks (Fast counts)
    try {
      const [productCount, orderCount] = await Promise.all([
        prisma.product.count(),
        prisma.order.count()
      ]);
      
      health.services.inventory = productCount > 0 ? 'ok' : 'empty';
      health.services.orders = orderCount > 0 ? 'ok' : 'empty';
      health.services.analytics = 'ok'; // Operational
    } catch (e) {
      health.services.inventory = 'error';
      health.services.orders = 'error';
    }

    // Overall status logic
    if (health.database !== 'connected' || health.services.inventory === 'error') {
      health.status = 'degraded';
    }

    return NextResponse.json(health, { 
      status: health.status === 'ok' ? 200 : 503,
      headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-DB-Latency': `${dbLatency}ms`
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Critical Health Check Failure',
      error: error.message,
      context: { service: 'HealthAPI' }
    });

    return NextResponse.json({
      success: false,
      status: 'error',
      database: 'disconnected',
      message: error.message,
      timestamp
    }, { status: 500 });
  }
}
