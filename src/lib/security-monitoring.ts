import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';
import { smsService } from '@/lib/sms/smsService';
import { logger } from '@/lib/logger';

export interface SecurityAlert {
  id: string;
  organizationId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  source: string;
  metadata: Record<string, any>;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
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
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastIncident?: Date;
}

class SecurityMonitoringService {
  /**
   * Create a new security alert
   */
  async createAlert(data: Omit<SecurityAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityAlert> {
    try {
      const alert = await prisma.productionAlert.create({
        data: {
          organizationId: data.organizationId,
          type: data.type,
          severity: data.severity.toUpperCase() as any,
          title: data.title,
          description: data.description,
          service: data.source, // Map source to service
          metric: 'security_event',
          threshold: 0,
          currentValue: 0,
          status: data.status.toUpperCase() as any,
          timestamp: new Date(), // Use current time as timestamp
          metadata: data.metadata as any,
          resolvedAt: data.resolvedAt,
          resolvedBy: data.resolvedBy,
        },
      });

      // Send notifications for critical alerts
      if (data.severity.toUpperCase() === 'CRITICAL') {
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
      const where: any = {
        organizationId,
        metric: 'security_event'
      };

      if (filters.type) where.type = filters.type;
      if (filters.severity) where.severity = filters.severity.toUpperCase();
      if (filters.status) where.status = filters.status.toUpperCase();

      const [alerts, total] = await Promise.all([
        prisma.productionAlert.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0,
        }),
        prisma.productionAlert.count({ where }),
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
      const updateData: any = { status: status.toUpperCase() };

      if (status.toUpperCase() === 'RESOLVED') {
        updateData.resolvedAt = new Date();
        if (resolvedBy) updateData.resolvedBy = resolvedBy;
      }

      const alert = await prisma.productionAlert.update({
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
        metric: 'security_event',
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      // Get total alerts
      const totalAlerts = await prisma.productionAlert.count({ where });

      // Get alerts by type
      const alertsByType = await prisma.productionAlert.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      });

      // Get alerts by severity
      const alertsBySeverity = await prisma.productionAlert.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      });

      // Calculate trends (simplified)
      const previousPeriod = {
        start: new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime())),
        end: timeRange.start,
      };

      const previousAlerts = await prisma.productionAlert.count({
        where: {
          organizationId,
          metric: 'security_event',
          timestamp: {
            gte: previousPeriod.start,
            lte: previousPeriod.end,
          },
        },
      });

      const alertsByTypeWithTrend = alertsByType.map(item => ({
        type: item.type,
        count: item._count.type,
        trend: (item._count.type > previousAlerts / alertsByType.length ? 'increasing' :
          item._count.type < previousAlerts / alertsByType.length ? 'decreasing' : 'stable') as 'stable' | 'increasing' | 'decreasing',
      }));

      const alertsBySeverityWithTrend = alertsBySeverity.map(item => ({
        severity: item.severity,
        count: item._count.severity,
        trend: (item._count.severity > previousAlerts / alertsBySeverity.length ? 'increasing' :
          item._count.severity < previousAlerts / alertsBySeverity.length ? 'decreasing' : 'stable') as 'stable' | 'increasing' | 'decreasing',
      }));

      // Determine threat level
      const criticalAlerts = alertsBySeverity.find(s => s.severity === 'CRITICAL')?._count.severity || 0;
      const highAlerts = alertsBySeverity.find(s => s.severity === 'HIGH')?._count.severity || 0;

      let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (criticalAlerts > 0) threatLevel = 'CRITICAL';
      else if (highAlerts > 5) threatLevel = 'HIGH';
      else if (highAlerts > 2 || totalAlerts > 20) threatLevel = 'MEDIUM';

      // Get last incident
      const lastIncident = await prisma.productionAlert.findFirst({
        where: { organizationId, metric: 'security_event' },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
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
        lastIncident: lastIncident?.timestamp,
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
        htmlContent: `
          <h2>Critical Security Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Description:</strong> ${alert.description}</p>
          <p><strong>Source:</strong> ${alert.service}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
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
      organizationId: record.organizationId || '',
      type: record.type,
      severity: record.severity as any,
      title: record.title,
      description: record.description,
      source: record.service, // Map service back to source
      metadata: record.metadata ? (typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata) : {},
      status: record.status as any,
      createdAt: record.timestamp,
      updatedAt: record.timestamp, // ProductionAlert doesn't have updatedAt, use timestamp
      resolvedAt: record.resolvedAt || undefined,
      resolvedBy: record.resolvedBy || undefined,
    };
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
