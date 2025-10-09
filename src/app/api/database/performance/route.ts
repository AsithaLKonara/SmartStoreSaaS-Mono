import { NextRequest, NextResponse } from 'next/server';
import { databaseOptimizer } from '@/lib/database/optimization';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

const getDatabasePerformance = async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'metrics';

    switch (action) {
      case 'metrics':
        const metrics = databaseOptimizer.getQueryMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            queryMetrics: metrics,
            recommendations: [
              'Consider adding indexes for frequently queried columns',
              'Use SELECT with specific fields instead of SELECT *',
              'Implement query result caching for expensive operations',
              'Monitor slow queries and optimize them',
              'Use database connection pooling',
            ],
          },
          timestamp: new Date().toISOString(),
        });

      case 'slow-queries':
        const slowQueries = databaseOptimizer.getQueryMetrics().slowQueries;
        
        return NextResponse.json({
          success: true,
          data: {
            slowQueries: slowQueries.slice(0, 20), // Top 20 slow queries
            totalSlowQueries: slowQueries.length,
          },
          timestamp: new Date().toISOString(),
        });

      case 'optimization-tips':
        return NextResponse.json({
          success: true,
          data: {
            tips: [
              'Use database indexes for columns in WHERE, ORDER BY, and JOIN clauses',
              'Avoid SELECT * - only select needed columns',
              'Use LIMIT for pagination to reduce data transfer',
              'Implement query result caching for expensive operations',
              'Use database-level aggregations instead of application-level calculations',
              'Consider using database views for complex queries',
              'Monitor and analyze slow query logs regularly',
              'Use connection pooling for better performance',
              'Consider read replicas for read-heavy workloads',
              'Optimize JOIN operations by ensuring proper indexes',
            ],
          },
          timestamp: new Date().toISOString(),
        });

      case 'health':
        const queryMetrics = databaseOptimizer.getQueryMetrics();
        const averageResponseTime = queryMetrics.averageExecutionTime;
        const slowQueryCount = queryMetrics.slowQueries.length;
        
        let status = 'healthy';
        const alerts = [];
        
        if (averageResponseTime > 2000) {
          status = 'warning';
          alerts.push(`High average query time: ${averageResponseTime}ms`);
        }
        
        if (slowQueryCount > 10) {
          status = 'critical';
          alerts.push(`High number of slow queries: ${slowQueryCount}`);
        }
        
        return NextResponse.json({
          success: true,
          data: {
            status,
            metrics: {
              averageQueryTime: averageResponseTime,
              totalQueries: queryMetrics.totalQueries,
              slowQueries: slowQueryCount,
            },
            alerts,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter',
          availableActions: ['metrics', 'slow-queries', 'optimization-tips', 'health'],
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Database performance monitoring error:', error);
    throw error;
  }
};

export const GET = withErrorHandling(getDatabasePerformance);

