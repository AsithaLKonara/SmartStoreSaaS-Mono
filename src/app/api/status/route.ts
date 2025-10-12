/**
 * System Status Endpoint
 * Provides detailed health and status information for monitoring
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

interface StatusCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  details?: any;
  error?: string;
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<StatusCheck> {
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get some basic stats
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'database',
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
      details: {
        users: userCount,
        organizations: orgCount,
        connected: true
      }
    };
  } catch (error: any) {
    return {
      name: 'database',
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Check NextAuth service
 */
async function checkAuth(): Promise<StatusCheck> {
  try {
    // Check if NextAuth endpoint is accessible
    const authUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${authUrl}/api/auth/session`, {
      method: 'GET'
    }).catch(() => null);
    
    return {
      name: 'authentication',
      status: response ? 'operational' : 'degraded',
      details: {
        provider: 'NextAuth',
        configured: !!process.env.NEXTAUTH_SECRET
      }
    };
  } catch (error: any) {
    return {
      name: 'authentication',
      status: 'degraded',
      error: error.message
    };
  }
}

/**
 * Check external integrations
 */
async function checkIntegrations(): Promise<StatusCheck> {
  const configured = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    twilio: !!process.env.TWILIO_ACCOUNT_SID,
    payhere: !!process.env.PAYHERE_MERCHANT_ID,
    shopify: !!process.env.SHOPIFY_API_KEY,
    woocommerce: !!process.env.WOOCOMMERCE_URL,
    openai: !!process.env.OPENAI_API_KEY
  };
  
  const configuredCount = Object.values(configured).filter(Boolean).length;
  const totalCount = Object.keys(configured).length;
  
  return {
    name: 'integrations',
    status: configuredCount > 0 ? 'operational' : 'degraded',
    details: {
      configured: configuredCount,
      total: totalCount,
      services: configured
    }
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    node: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      limit: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    environment: process.env.NODE_ENV
  };
}

/**
 * GET /api/status
 * Returns comprehensive system status
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Run all checks in parallel
    const [database, auth, integrations] = await Promise.all([
      checkDatabase(),
      checkAuth(),
      checkIntegrations()
    ]);
    
    const checks = [database, auth, integrations];
    
    // Determine overall status
    const hasDown = checks.some(c => c.status === 'down');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    
    let overallStatus: 'operational' | 'degraded' | 'down';
    if (hasDown) {
      overallStatus = 'down';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'operational';
    }
    
    const responseTime = Date.now() - startTime;
    
    const status = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      version: process.env.npm_package_version || '1.2.0',
      checks,
      system: getSystemInfo()
    };
    
    // Return appropriate status code
    const statusCode = overallStatus === 'down' ? 503 : 200;
    
    return NextResponse.json(status, { status: statusCode });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error.message,
      system: getSystemInfo()
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * HEAD /api/status
 * Lightweight status check
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}

