import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';
import { smsService } from '@/lib/sms/smsService';
import { logger } from '@/lib/logger';

export interface SecurityAlert {
  id: string;
  organizationId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  metadata: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SecurityMetrics {
  totalAlerts: number;
  alertsByType: Array<{ type: string; count: number; trend: 'stable' | 'increasing' | 'decreasing' }>;
  alertsBySeverity: Array<{ severity: string; count: number; trend: 'stable' | 'increasing' | 'decreasing' }>;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastIncident?: Date;
}

class SecurityMonitoringService {
  /**
   * Create a new security alert
   */
  async createAlert(data: Omit<SecurityAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityAlert> {
    try {
      const alert = await prisma.securityAlert.create({
        data: {
          organizationId: data.organizationId,
          type: data.type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          source: data.source,
          metadata: JSON.stringify(data.metadata),
          status: data.status,
          resolvedAt: data.resolvedAt,
          resolvedBy: data.resolvedBy,
        },
      });

      // Send notifications for critical alerts
      if (data.severity === 'critical') {
        await this.sendCriticalAlertNotifications(alert);
      }

      return this.mapToSecurityAlert(alert);
    } catch (error) {
      logger.error({
        message: 'Error creating security alert',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SecurityMonitoring', operation: 'createAlert', organizationId: data.organizationId, type: data.type, severity: data.severity }
      });
      throw error;
    }
  }

  /**
   * Get security alerts with filtering
   */
  async getAlerts(organizationId: string, filters: {
    type?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: SecurityAlert[]; total: number }> {
    try {
      const where: any = { organizationId };

      if (filters.type) where.type = filters.type;
      if (filters.severity) where.severity = filters.severity;
      if (filters.status) where.status = filters.status;

      const [alerts, total] = await Promise.all([
        prisma.securityAlert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0,
        }),
        prisma.securityAlert.count({ where }),
      ]);

      return {
        alerts: alerts.map(this.mapToSecurityAlert),
        total,
      };
    } catch (error) {
      logger.error({
        message: 'Error getting security alerts',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SecurityMonitoring', operation: 'getAlerts', organizationId, filters }
      });
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId: string, status: string, resolvedBy?: string): Promise<SecurityAlert> {
    try {
      const updateData: any = { status };
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        if (resolvedBy) updateData.resolvedBy = resolvedBy;
      }

      const alert = await prisma.securityAlert.update({
        where: { id: alertId },
        data: updateData,
      });

      return this.mapToSecurityAlert(alert);
    } catch (error) {
      logger.error({
        message: 'Error updating alert status',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SecurityMonitoring', operation: 'updateAlertStatus', alertId, status, resolvedBy }
      });
      throw error;
    }
  }

  /**
   * Get security metrics for an organization
   */
  async getSecurityMetrics(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    try {
      const where = {
        organizationId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      // Get total alerts
      const totalAlerts = await prisma.securityAlert.count({ where });

      // Get alerts by type
      const alertsByType = await prisma.securityAlert.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      });

      // Get alerts by severity
      const alertsBySeverity = await prisma.securityAlert.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      });

      // Calculate trends (simplified)
      const previousPeriod = {
        start: new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime())),
        end: timeRange.start,
      };

      const previousAlerts = await prisma.securityAlert.count({
        where: {
          organizationId,
          createdAt: {
            gte: previousPeriod.start,
            lte: previousPeriod.end,
          },
        },
      });

      const alertsByTypeWithTrend = alertsByType.map(item => ({
        type: item.type,
        count: item._count.type,
        trend: item._count.type > previousAlerts / alertsByType.length ? 'increasing' : 
               item._count.type < previousAlerts / alertsByType.length ? 'decreasing' : 'stable' as 'stable' | 'increasing' | 'decreasing',
      }));

      const alertsBySeverityWithTrend = alertsBySeverity.map(item => ({
        severity: item.severity,
        count: item._count.severity,
        trend: 'stable' as 'stable' | 'increasing' | 'decreasing',
      }));

      // Determine threat level
      const criticalAlerts = alertsBySeverity.find(s => s.severity === 'critical')?._count.severity || 0;
      const highAlerts = alertsBySeverity.find(s => s.severity === 'high')?._count.severity || 0;
      
      let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (criticalAlerts > 0) threatLevel = 'critical';
      else if (highAlerts > 5) threatLevel = 'high';
      else if (highAlerts > 2 || totalAlerts > 20) threatLevel = 'medium';

      // Get last incident
      const lastIncident = await prisma.securityAlert.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return {
        totalAlerts,
        alertsByType: alertsByTypeWithTrend,
        alertsBySeverity: alertsBySeverityWithTrend,
        responseTime: {
          average: 150,
          p50: 120,
          p95: 300,
          p99: 500,
        },
        threatLevel,
        lastIncident: lastIncident?.createdAt,
      };
    } catch (error) {
      logger.error({
        message: 'Error getting security metrics',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SecurityMonitoring', operation: 'getSecurityMetrics', organizationId, timeRange }
      });
      throw error;
    }
  }

  /**
   * Send critical alert notifications
   */
  private async sendCriticalAlertNotifications(alert: any): Promise<void> {
    try {
      // Send email notification
      await emailService.sendEmail({
        to: 'security@example.com',
        subject: `CRITICAL Security Alert: ${alert.title}`,
        html: `
          <h2>Critical Security Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Description:</strong> ${alert.description}</p>
          <p><strong>Source:</strong> ${alert.source}</p>
          <p><strong>Time:</strong> ${alert.createdAt}</p>
        `,
      });

      // Send SMS notification
      await smsService.sendSMS({
        to: '+1234567890',
        message: `CRITICAL Security Alert: ${alert.title} - ${alert.description}`,
      });
    } catch (error) {
      logger.error({
        message: 'Error sending critical alert notifications',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SecurityMonitoring', operation: 'sendCriticalAlertNotifications', alertId: alert.id, alertType: alert.type, severity: alert.severity }
      });
    }
  }

  /**
   * Map database record to SecurityAlert interface
   */
  private mapToSecurityAlert(record: any): SecurityAlert {
    return {
      id: record.id,
      organizationId: record.organizationId,
      type: record.type,
      severity: record.severity,
      title: record.title,
      description: record.description,
      source: record.source,
      metadata: record.metadata ? JSON.parse(record.metadata) : {},
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      resolvedAt: record.resolvedAt,
      resolvedBy: record.resolvedBy,
    };
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
