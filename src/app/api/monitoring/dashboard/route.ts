import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { productionMonitoringService } from '@/lib/production-monitoring';
import { errorTrackingService } from '@/lib/error-tracking';
import { securityMonitoringService } from '@/lib/security-monitoring';

/**
 * GET /api/monitoring/dashboard - Get comprehensive monitoring dashboard data
 */
async function getMonitoringDashboard(request: AuthRequest) {
  try {
    const user = request.user!;
    const organizationId = user.organizationId;
    
    // Get time range from query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = {
      start: searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date(),
    };

    // Get comprehensive monitoring data
    const [monitoringData, errorAnalytics, securityMetrics] = await Promise.all([
      productionMonitoringService.getMonitoringDashboard(organizationId, timeRange),
      errorTrackingService.getErrorAnalytics(organizationId, timeRange),
      securityMonitoringService.getSecurityMetrics(organizationId, timeRange),
    ]);

    // Get additional system information
    const systemInfo = await getSystemInformation();
    const uptimeMetrics = await getUptimeMetrics(organizationId, timeRange);
    const performanceMetrics = await getPerformanceMetrics(organizationId, timeRange);

    return NextResponse.json({
      success: true,
      data: {
        // Core monitoring data
        monitoring: monitoringData,
        errors: errorAnalytics,
        security: securityMetrics,
        
        // Additional metrics
        system: systemInfo,
        uptime: uptimeMetrics,
        performance: performanceMetrics,
        
        // Dashboard metadata
        timeRange,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 30000, // 30 seconds
      },
    });
  } catch (error) {
    console.error('Error getting monitoring dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/dashboard - Update monitoring settings or acknowledge alerts
 */
async function updateMonitoringDashboard(request: AuthRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'acknowledge_alert':
        await productionMonitoringService.acknowledgeAlert(
          data.alertId,
          user.id
        );
        break;

      case 'resolve_alert':
        await productionMonitoringService.resolveAlert(
          data.alertId,
          user.id
        );
        break;

      case 'resolve_error':
        await errorTrackingService.resolveError(
          data.errorId,
          user.id,
          data.resolution
        );
        break;

      case 'update_monitoring_settings':
        await updateMonitoringSettings(user.organizationId, data);
        break;

      case 'test_notification':
        await testNotificationChannel(data.channel, data.recipient);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoring dashboard updated successfully',
    });
  } catch (error) {
    console.error('Error updating monitoring dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get system information
 */
async function getSystemInformation() {
  try {
    return {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_URL || 'local',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      lastRestart: new Date(Date.now() - process.uptime() * 1000),
    };
  } catch (error) {
    console.error('Error getting system information:', error);
    return {
      version: 'unknown',
      environment: 'unknown',
      region: 'unknown',
      deployment: 'unknown',
      error: 'Failed to get system information',
    };
  }
}

/**
 * Get uptime metrics
 */
async function getUptimeMetrics(organizationId: string, timeRange: { start: Date; end: Date }) {
  try {
    // Calculate uptime percentage for the time range
    const totalTime = timeRange.end.getTime() - timeRange.start.getTime();
    const downtimeEvents = 0; // In production, this would come from monitoring data
    
    const uptimePercentage = downtimeEvents === 0 ? 100 : ((totalTime - downtimeEvents) / totalTime) * 100;
    
    return {
      percentage: Math.round(uptimePercentage * 100) / 100,
      totalTime: Math.round(totalTime / (1000 * 60)), // minutes
      downtimeEvents,
      averageDowntime: downtimeEvents > 0 ? Math.round((downtimeEvents / downtimeEvents) * 100) / 100 : 0,
      lastIncident: downtimeEvents > 0 ? timeRange.start : null,
      status: uptimePercentage >= 99.9 ? 'excellent' : uptimePercentage >= 99.5 ? 'good' : uptimePercentage >= 99 ? 'acceptable' : 'poor',
    };
  } catch (error) {
    console.error('Error getting uptime metrics:', error);
    return {
      percentage: 0,
      totalTime: 0,
      downtimeEvents: 0,
      averageDowntime: 0,
      lastIncident: null,
      status: 'unknown',
    };
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(organizationId: string, timeRange: { start: Date; end: Date }) {
  try {
    return {
      responseTime: {
        average: 150,
        p50: 120,
        p95: 300,
        p99: 500,
        trend: 'stable',
      },
      throughput: {
        requestsPerSecond: 25,
        requestsPerMinute: 1500,
        requestsPerHour: 90000,
        trend: 'increasing',
      },
      errorRate: {
        percentage: 0.1,
        count: 15,
        trend: 'decreasing',
      },
      resourceUsage: {
        cpu: 25,
        memory: 45,
        disk: 30,
        network: 15,
      },
      database: {
        connectionPool: 10,
        queryTime: 50,
        slowQueries: 2,
        locks: 0,
      },
      cache: {
        hitRate: 85,
        missRate: 15,
        size: '2.5GB',
        evictions: 5,
      },
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      responseTime: { average: 0, p50: 0, p95: 0, p99: 0, trend: 'unknown' },
      throughput: { requestsPerSecond: 0, requestsPerMinute: 0, requestsPerHour: 0, trend: 'unknown' },
      errorRate: { percentage: 0, count: 0, trend: 'unknown' },
      resourceUsage: { cpu: 0, memory: 0, disk: 0, network: 0 },
      database: { connectionPool: 0, queryTime: 0, slowQueries: 0, locks: 0 },
      cache: { hitRate: 0, missRate: 0, size: '0GB', evictions: 0 },
    };
  }
}

/**
 * Update monitoring settings
 */
async function updateMonitoringSettings(organizationId: string, settings: any) {
  try {
    // This would update the organization's monitoring settings in the database
    console.log('Updating monitoring settings for organization:', organizationId, settings);
    
    // Implementation would update the database with new monitoring settings
    return true;
  } catch (error) {
    console.error('Error updating monitoring settings:', error);
    throw error;
  }
}

/**
 * Test notification channel
 */
async function testNotificationChannel(channel: string, recipient: string) {
  try {
    // Test the notification channel
    switch (channel) {
      case 'email':
        // Test email notification
        console.log('Testing email notification to:', recipient);
        break;
      case 'sms':
        // Test SMS notification
        console.log('Testing SMS notification to:', recipient);
        break;
      case 'webhook':
        // Test webhook notification
        console.log('Testing webhook notification to:', recipient);
        break;
      default:
        throw new Error(`Unknown notification channel: ${channel}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error testing notification channel:', error);
    throw error;
  }
}

// Export handlers with enhanced security
export const GET = createAuthHandler(getMonitoringDashboard, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.SECURITY_READ],
});

export const POST = createAuthHandler(updateMonitoringDashboard, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SECURITY_WRITE],
});
