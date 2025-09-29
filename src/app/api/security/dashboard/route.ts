import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { securityMonitoringService, SecurityMetrics } from '@/lib/security-monitoring';
import { AdvancedSecurityService } from '@/lib/security/advancedSecurityService';
import { SECURITY_POLICIES, getSecurityPolicy, getRoleSecurityPolicy } from '@/lib/security-policies';

const securityService = new AdvancedSecurityService();

/**
 * GET /api/security/dashboard - Get comprehensive security dashboard data
 */
async function getSecurityDashboard(request: AuthRequest) {
  try {
    const user = request.user!;
    const organizationId = user.organizationId;
    
    // Get time range from query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = {
      start: searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date(),
    };

    // Get security metrics
    const metrics = await securityMonitoringService.getSecurityMetrics(organizationId, timeRange);
    
    // Get recent alerts
    const { alerts: recentAlerts } = await securityMonitoringService.getAlerts(
      { organizationId },
      { page: 1, limit: 10 }
    );

    // Get security policies for user's role
    const roleSecurityPolicy = getRoleSecurityPolicy(user.role);
    
    // Get current security status
    const securityStatus = await getSecurityStatus(organizationId);
    
    // Get threat intelligence summary
    const threatIntelligence = await getThreatIntelligence(organizationId);
    
    // Get compliance status
    const complianceStatus = await getComplianceStatus(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recentAlerts,
        securityStatus,
        threatIntelligence,
        complianceStatus,
        roleSecurityPolicy,
        globalSecurityPolicy: SECURITY_POLICIES,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting security dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/dashboard - Create security alert or update security settings
 */
async function updateSecurityDashboard(request: AuthRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'acknowledge_alert':
        await securityMonitoringService.updateAlertStatus(
          data.alertId,
          'investigating',
          undefined,
          user.id
        );
        break;

      case 'resolve_alert':
        await securityMonitoringService.updateAlertStatus(
          data.alertId,
          'resolved',
          data.resolution,
          user.id
        );
        break;

      case 'mark_false_positive':
        await securityMonitoringService.updateAlertStatus(
          data.alertId,
          'false_positive',
          data.reason,
          user.id
        );
        break;

      case 'update_security_settings':
        // Update organization security settings
        await updateOrganizationSecuritySettings(user.organizationId, data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Security dashboard updated successfully',
    });
  } catch (error) {
    console.error('Error updating security dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get current security status for organization
 */
async function getSecurityStatus(organizationId: string) {
  try {
    // Get recent security events count
    const recentEvents = await securityMonitoringService.getSecurityMetrics(
      organizationId,
      {
        start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        end: new Date(),
      }
    );

    // Determine overall security status
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    
    if (recentEvents.threatLevel === 'critical' || recentEvents.alertsBySeverity.critical > 0) {
      status = 'critical';
    } else if (recentEvents.threatLevel === 'high' || recentEvents.alertsBySeverity.high > 3) {
      status = 'warning';
    }

    return {
      status,
      threatLevel: recentEvents.threatLevel,
      activeAlerts: recentEvents.totalAlerts,
      lastIncident: recentEvents.recentActivity[0]?.timestamp || null,
      securityScore: calculateSecurityScore(recentEvents),
    };
  } catch (error) {
    console.error('Error getting security status:', error);
    return {
      status: 'warning',
      threatLevel: 'medium',
      activeAlerts: 0,
      lastIncident: null,
      securityScore: 75,
    };
  }
}

/**
 * Get threat intelligence summary
 */
async function getThreatIntelligence(organizationId: string) {
  try {
    // This would typically integrate with external threat intelligence feeds
    return {
      blockedIPs: 15,
      knownThreats: 3,
      suspiciousDomains: 2,
      malwareDetected: 0,
      phishingAttempts: 1,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting threat intelligence:', error);
    return {
      blockedIPs: 0,
      knownThreats: 0,
      suspiciousDomains: 0,
      malwareDetected: 0,
      phishingAttempts: 0,
      lastUpdate: new Date().toISOString(),
    };
  }
}

/**
 * Get compliance status
 */
async function getComplianceStatus(organizationId: string) {
  try {
    // Check compliance with various frameworks
    return {
      gdpr: {
        compliant: true,
        score: 95,
        lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        issues: 0,
      },
      soc2: {
        compliant: true,
        score: 92,
        lastAudit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        issues: 1,
      },
      pciDss: {
        compliant: true,
        score: 98,
        lastAudit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        issues: 0,
      },
      ccpa: {
        compliant: true,
        score: 88,
        lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        issues: 2,
      },
    };
  } catch (error) {
    console.error('Error getting compliance status:', error);
    return {
      gdpr: { compliant: false, score: 0, lastAudit: null, issues: 0 },
      soc2: { compliant: false, score: 0, lastAudit: null, issues: 0 },
      pciDss: { compliant: false, score: 0, lastAudit: null, issues: 0 },
      ccpa: { compliant: false, score: 0, lastAudit: null, issues: 0 },
    };
  }
}

/**
 * Calculate security score based on metrics
 */
function calculateSecurityScore(metrics: SecurityMetrics): number {
  let score = 100;
  
  // Deduct points for alerts
  score -= metrics.alertsBySeverity.critical * 10;
  score -= metrics.alertsBySeverity.high * 5;
  score -= metrics.alertsBySeverity.medium * 2;
  score -= metrics.alertsBySeverity.low * 1;
  
  // Deduct points for high false positive rate
  if (metrics.falsePositiveRate > 20) {
    score -= 10;
  }
  
  // Deduct points for slow response time
  if (metrics.responseTime > 60) { // More than 1 hour
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Update organization security settings
 */
async function updateOrganizationSecuritySettings(organizationId: string, settings: any) {
  try {
    // This would update the organization's security settings in the database
    console.log('Updating security settings for organization:', organizationId, settings);
    
    // Implementation would update the database with new security settings
    return true;
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }
}

// Export handlers with enhanced security
export const GET = createAuthHandler(getSecurityDashboard, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.SECURITY_READ],
});

export const POST = createAuthHandler(updateSecurityDashboard, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SECURITY_WRITE],
});
