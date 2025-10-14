/**
 * Monitoring Status API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_MONITORING permission)
 * 
 * Returns detailed system status and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const startTime = Date.now();
      
      // Database health check
      const dbStart = Date.now();
      const userCount = await prisma.user.count();
      const orgCount = await prisma.organization.count();
      const dbTime = Date.now() - dbStart;
      
      // Memory usage
      const memoryUsage = process.memoryUsage();
      
      // System uptime
      const uptime = process.uptime();
      
      // Environment info
      const environment = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV || 'development'
      };
      
      const isHealthy = dbTime < 5000 && userCount > 0;
      const responseTime = Date.now() - startTime;
      
      const status = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        uptime: Math.floor(uptime),
        responseTime,
        database: {
          connected: true,
          responseTime: dbTime,
          users: userCount,
          organizations: orgCount
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        environment,
        checks: {
          database: dbTime < 5000,
          memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9,
          uptime: uptime > 0
        }
      };
      
      logger.info({
        message: 'Monitoring status fetched',
        context: {
          userId: user.id,
          role: user.role,
          systemStatus: status.status
        }
      });
      
      return NextResponse.json(
        successResponse(status),
        {
          status: isHealthy ? 200 : 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    } catch (error: any) {
      logger.error({
        message: 'Monitoring status check failed',
        error: error,
        context: { userId: user.id }
      });
      
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        },
        { status: 503 }
      );
    }
  }
);
