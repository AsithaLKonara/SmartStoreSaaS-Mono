import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const healthChecks = await Promise.allSettled([
      checkDatabase(),
      checkEnvironmentVariables(),
      checkExternalServices(),
    ]);

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: ['database', 'environment', 'external'][index],
          status: 'unhealthy',
          error: result.reason.message,
        };
      }
    });

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: results,
    }, { 
      status: overallStatus === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 503 });
  }
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'healthy',
      details: 'Database connection successful',
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      error: 'Database connection failed',
    };
  }
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    return {
      name: 'environment',
      status: 'unhealthy',
      error: `Missing environment variables: ${missingVars.join(', ')}`,
    };
  }

  return {
    name: 'environment',
    status: 'healthy',
    details: 'All required environment variables are set',
  };
}

async function checkExternalServices() {
  // Check if OpenAI API key is available (optional)
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  return {
    name: 'external',
    status: 'healthy',
    details: {
      openai: hasOpenAI ? 'configured' : 'not configured',
    },
  };
}
