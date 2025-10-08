import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    // Test database performance using connection pool
    const dbStartTime = Date.now();
    const [productsCount, ordersCount, customersCount] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customers.count()
    ]);
    const dbEndTime = Date.now();
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const dbTime = dbEndTime - dbStartTime;
    
    // Calculate performance metrics
    const performanceMetrics = {
      timestamp: new Date().toISOString(),
      totalResponseTime: totalTime,
      databaseQueryTime: dbTime,
      overheadTime: totalTime - dbTime,
      database: {
        productsCount,
        ordersCount,
        customersCount,
        averageQueryTime: dbTime / 3
      },
      performance: {
        status: totalTime < 1000 ? 'excellent' : totalTime < 2000 ? 'good' : 'needs_optimization',
        recommendations: []
      }
    };
    
    // Add recommendations based on performance
    if (totalTime > 2000) {
      performanceMetrics.performance.recommendations.push('Consider implementing caching for frequently accessed data');
    }
    if (dbTime > 1000) {
      performanceMetrics.performance.recommendations.push('Database queries are slow, consider optimization');
    }
    if (performanceMetrics.performance.overheadTime > 500) {
      performanceMetrics.performance.recommendations.push('High overhead time, check for inefficient operations');
    }
    
    return NextResponse.json({
      success: true,
      data: performanceMetrics,
      message: 'Performance metrics collected successfully'
    });
    
  } catch (error) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performanceMetrics: {
        timestamp: new Date().toISOString(),
        totalResponseTime: totalTime,
        status: 'error'
      }
    }, { status: 500 });
  }
});


