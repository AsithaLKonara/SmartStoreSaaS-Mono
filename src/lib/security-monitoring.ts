import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { emailService } from './email/emailService';
import { smsService } from './sms/smsService';

export interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'system_anomaly' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  details: any;
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  tags: string[];
}

export interface SecurityMetrics {
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByType: Record<string, number>;
  responseTime: number; // average response time in minutes
  falsePositiveRate: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  topThreats: Array<{
    type: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  recentActivity: Array<{
    timestamp: Date;
    event: string;
    severity: string;
    ipAddress: string;
  }>;
}

export class SecurityMonitoringService {
  private alertThresholds = {
    bruteForce: { count: 5, window: 15 }, // 5 attempts in 15 minutes
    suspiciousActivity: { count: 10, window: 60 }, // 10 events in 60 minutes
    rateLimit: { count: 100, window: 60 }, // 100 requests in 60 minutes
    dataAccess: { count: 50, window: 60 }, // 50 data access events in 60 minutes
  };

  private notificationChannels = {
    email: true,
    sms: false,
    webhook: false,
    slack: false,
  };

  /**
   * Create a new security alert
   */
  async createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>): Promise<SecurityAlert> {
    try {
      const newAlert: SecurityAlert = {
        ...alert,
        id: this.generateAlertId(),
        timestamp: new Date(),
        status: 'open',
      };

      // Store in database
      await this.storeAlert(newAlert);

      // Send notifications if severity is high enough
      if (this.shouldNotify(newAlert)) {
        await this.sendNotifications(newAlert);
      }

      // Check for alert escalation
      await this.checkAlertEscalation(newAlert);

      return newAlert;
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  }

  /**
   * Analyze security events and create alerts if thresholds are exceeded
   */
  async analyzeSecurityEvent(event: {
    type: string;
    severity: string;
    userId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    timestamp: Date;
  }): Promise<SecurityAlert | null> {
    try {
      // Check for brute force attempts
      if (event.type === 'failed_login') {
        const bruteForceAlert = await this.checkBruteForce(event);
        if (bruteForceAlert) return bruteForceAlert;
      }

      // Check for suspicious activity patterns
      if (event.severity === 'high' || event.severity === 'critical') {
        const suspiciousAlert = await this.checkSuspiciousActivity(event);
        if (suspiciousAlert) return suspiciousAlert;
      }

      // Check for rate limiting violations
      if (event.type === 'rate_limit_exceeded') {
        return await this.createRateLimitAlert(event);
      }

      // Check for unauthorized access attempts
      if (event.type === 'unauthorized_access') {
        return await this.createUnauthorizedAccessAlert(event);
      }

      return null;
    } catch (error) {
      console.error('Error analyzing security event:', error);
      return null;
    }
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(
    organizationId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
    }
  ): Promise<SecurityMetrics> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      // Get alerts within time range
      const alerts = await prisma.securityAlert.findMany({
        where: {
          ...whereClause,
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      // Calculate metrics
      const totalAlerts = alerts.length;
      
      const alertsBySeverity = alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const alertsByType = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average response time
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
      const responseTime = resolvedAlerts.length > 0 
        ? resolvedAlerts.reduce((sum, alert) => {
            const resolutionTime = alert.resolution ? new Date(alert.resolution).getTime() - alert.timestamp.getTime() : 0;
            return sum + resolutionTime;
          }, 0) / resolvedAlerts.length / (1000 * 60) // Convert to minutes
        : 0;

      // Calculate false positive rate
      const falsePositives = alerts.filter(a => a.status === 'false_positive').length;
      const falsePositiveRate = totalAlerts > 0 ? (falsePositives / totalAlerts) * 100 : 0;

      // Determine threat level
      const threatLevel = this.calculateThreatLevel(alertsBySeverity);

      // Get top threats
      const topThreats = Object.entries(alertsByType)
        .map(([type, count]) => ({
          type,
          count,
          trend: this.calculateTrend(type, timeRange), // Simplified trend calculation
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity
      const recentActivity = alerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
        .map(alert => ({
          timestamp: alert.timestamp,
          event: alert.title,
          severity: alert.severity,
          ipAddress: alert.ipAddress,
        }));

      return {
        totalAlerts,
        alertsBySeverity,
        alertsByType,
        responseTime,
        falsePositiveRate,
        threatLevel,
        topThreats,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: SecurityAlert['status'],
    resolution?: string,
    assignedTo?: string
  ): Promise<void> {
    try {
      await prisma.securityAlert.update({
        where: { id: alertId },
        data: {
          status,
          resolution,
          assignedTo,
        },
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  /**
   * Get alerts with filtering and pagination
   */
  async getAlerts(
    filters: {
      organizationId?: string;
      severity?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ alerts: SecurityAlert[]; total: number }> {
    try {
      const whereClause: any = {};

      if (filters.organizationId) whereClause.organizationId = filters.organizationId;
      if (filters.severity) whereClause.severity = filters.severity;
      if (filters.type) whereClause.type = filters.type;
      if (filters.status) whereClause.status = filters.status;
      if (filters.startDate || filters.endDate) {
        whereClause.timestamp = {};
        if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
        if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
      }

      const [alerts, total] = await Promise.all([
        prisma.securityAlert.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        prisma.securityAlert.count({ where: whereClause }),
      ]);

      return { alerts: alerts as SecurityAlert[], total };
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Check for brute force attempts
   */
  private async checkBruteForce(event: any): Promise<SecurityAlert | null> {
    const threshold = this.alertThresholds.bruteForce;
    const startTime = new Date(Date.now() - threshold.window * 60 * 1000);

    const recentAttempts = await prisma.securityAlert.count({
      where: {
        type: 'failed_login',
        ipAddress: event.ipAddress,
        timestamp: { gte: startTime },
      },
    });

    if (recentAttempts >= threshold.count) {
      return await this.createAlert({
        type: 'brute_force',
        severity: 'high',
        title: 'Brute Force Attack Detected',
        description: `Multiple failed login attempts detected from IP ${event.ipAddress}`,
        details: {
          ipAddress: event.ipAddress,
          attempts: recentAttempts,
          timeWindow: threshold.window,
        },
        userId: event.userId,
        organizationId: event.organizationId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        tags: ['brute-force', 'authentication', 'ip-block'],
      });
    }

    return null;
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(event: any): Promise<SecurityAlert | null> {
    const threshold = this.alertThresholds.suspiciousActivity;
    const startTime = new Date(Date.now() - threshold.window * 60 * 1000);

    const recentActivity = await prisma.securityAlert.count({
      where: {
        ipAddress: event.ipAddress,
        severity: { in: ['high', 'critical'] },
        timestamp: { gte: startTime },
      },
    });

    if (recentActivity >= threshold.count) {
      return await this.createAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Suspicious Activity Pattern',
        description: `High volume of suspicious activity detected from IP ${event.ipAddress}`,
        details: {
          ipAddress: event.ipAddress,
          activityCount: recentActivity,
          timeWindow: threshold.window,
        },
        userId: event.userId,
        organizationId: event.organizationId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        tags: ['suspicious-activity', 'pattern-detection'],
      });
    }

    return null;
  }

  /**
   * Create rate limit alert
   */
  private async createRateLimitAlert(event: any): Promise<SecurityAlert> {
    return await this.createAlert({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      title: 'Rate Limit Exceeded',
      description: `Rate limit exceeded for IP ${event.ipAddress}`,
      details: event.details,
      userId: event.userId,
      organizationId: event.organizationId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      tags: ['rate-limit', 'api-abuse'],
    });
  }

  /**
   * Create unauthorized access alert
   */
  private async createUnauthorizedAccessAlert(event: any): Promise<SecurityAlert> {
    return await this.createAlert({
      type: 'unauthorized_access',
      severity: 'high',
      title: 'Unauthorized Access Attempt',
      description: `Unauthorized access attempt detected from IP ${event.ipAddress}`,
      details: event.details,
      userId: event.userId,
      organizationId: event.organizationId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      tags: ['unauthorized-access', 'security-breach'],
    });
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: SecurityAlert): Promise<void> {
    await prisma.securityAlert.create({
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        details: JSON.stringify(alert.details),
        userId: alert.userId,
        organizationId: alert.organizationId,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent,
        timestamp: alert.timestamp,
        status: alert.status,
        assignedTo: alert.assignedTo,
        resolution: alert.resolution,
        tags: alert.tags.join(','),
      },
    });
  }

  /**
   * Send notifications for high-priority alerts
   */
  private async shouldNotify(alert: SecurityAlert): Promise<boolean> {
    return alert.severity === 'high' || alert.severity === 'critical';
  }

  /**
   * Send notifications
   */
  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    try {
      if (this.notificationChannels.email) {
        await this.sendEmailNotification(alert);
      }
      
      if (this.notificationChannels.sms) {
        await this.sendSMSNotification(alert);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: SecurityAlert): Promise<void> {
    const subject = `[${alert.severity.toUpperCase()}] Security Alert: ${alert.title}`;
    const body = `
Security Alert Details:
- Type: ${alert.type}
- Severity: ${alert.severity}
- Time: ${alert.timestamp.toISOString()}
- IP Address: ${alert.ipAddress}
- Description: ${alert.description}

Please investigate this security event immediately.

SmartStore Security Team
    `;

    // Send to security team
    await emailService.sendEmail({
      to: 'security@smartstore.com',
      subject,
      text: body,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: SecurityAlert): Promise<void> {
    const message = `SECURITY ALERT [${alert.severity}]: ${alert.title} - ${alert.ipAddress}`;
    
    // Send to security team
    await smsService.sendSMS({
      to: '+1234567890', // Security team phone
      message,
    });
  }

  /**
   * Check for alert escalation
   */
  private async checkAlertEscalation(alert: SecurityAlert): Promise<void> {
    // Implement escalation logic for critical alerts
    if (alert.severity === 'critical') {
      // Escalate to senior security team
      console.log(`Escalating critical alert: ${alert.id}`);
    }
  }

  /**
   * Calculate threat level based on alerts
   */
  private calculateThreatLevel(alertsBySeverity: Record<string, number>): 'low' | 'medium' | 'high' | 'critical' {
    if (alertsBySeverity.critical > 0) return 'critical';
    if (alertsBySeverity.high > 5) return 'high';
    if (alertsBySeverity.medium > 10 || alertsBySeverity.high > 0) return 'medium';
    return 'low';
  }

  /**
   * Calculate trend for threat type
   */
  private calculateTrend(type: string, timeRange: { start: Date; end: Date }): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation - would compare with previous period
    return 'stable';
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
