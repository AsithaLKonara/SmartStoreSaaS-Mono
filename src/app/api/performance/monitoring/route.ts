import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withSecurity } from '@/lib/security';

export const GET = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';
    const timeRange = searchParams.get('timeRange') || '24h';

    // Performance monitoring data
    const performanceData = {
      organizationId,
      timeRange,
      timestamp: new Date().toISOString(),
      metrics: {
        responseTime: {
          average: 245, // ms
          p95: 450,
          p99: 890,
          trend: 'down'
        },
        throughput: {
          requestsPerSecond: 1250,
          peakRPS: 2100,
          trend: 'up'
        },
        errorRate: {
          percentage: 0.12,
          count: 15,
          trend: 'down'
        },
        availability: {
          percentage: 99.88,
          uptime: '23h 58m',
          trend: 'stable'
        }
      },
      resources: {
        cpu: {
          usage: 45.2,
          peak: 78.5,
          trend: 'stable'
        },
        memory: {
          usage: 62.8,
          peak: 89.2,
          trend: 'up'
        },
        database: {
          connections: 45,
          maxConnections: 100,
          queryTime: 12.5
        }
      },
      alerts: [
        {
          id: 'alert-001',
          type: 'warning',
          message: 'High memory usage detected',
          timestamp: '2024-01-15T14:30:00Z',
          resolved: false
        },
        {
          id: 'alert-002',
          type: 'info',
          message: 'Database connection pool at 80% capacity',
          timestamp: '2024-01-15T13:45:00Z',
          resolved: true
        }
      ]
    };

    return NextResponse.json(performanceData);
  })
);
