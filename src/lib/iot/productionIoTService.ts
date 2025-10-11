/**
 * Production IoT Service
 * Complete implementation using actual database models
 * All TODOs resolved - production-ready
 */

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';
import { smsService } from '@/lib/sms/smsService';

export interface IoTDevice {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  batteryLevel?: number;
  lastSeen?: Date;
  organizationId: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  type: string;
  value: number;
  unit: string;
  location: string;
  timestamp: Date;
}

export interface IoTAlert {
  id: string;
  deviceId: string;
  type: string;
  severity: string;
  message: string;
  isResolved: boolean;
  createdAt: Date;
}

export class ProductionIoTService {
  /**
   * Register new IoT device
   */
  async registerDevice(deviceData: {
    name: string;
    type: string;
    location: string;
    macAddress: string;
    organizationId: string;
    warehouseId?: string;
    firmwareVersion?: string;
  }): Promise<IoTDevice> {
    const device = await prisma.iot_devices.create({
      data: {
        id: `device-${Date.now()}`,
        name: deviceData.name,
        type: deviceData.type,
        location: deviceData.location,
        macAddress: deviceData.macAddress,
        organizationId: deviceData.organizationId,
        warehouseId: deviceData.warehouseId,
        firmwareVersion: deviceData.firmwareVersion || '1.0.0',
        status: 'online',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return device as IoTDevice;
  }

  /**
   * Record sensor reading
   */
  async recordSensorReading(readingData: {
    deviceId: string;
    type: string;
    value: number;
    unit: string;
    location: string;
  }): Promise<SensorReading> {
    const reading = await prisma.sensor_readings.create({
      data: {
        id: `reading-${Date.now()}`,
        deviceId: readingData.deviceId,
        type: readingData.type,
        value: readingData.value,
        unit: readingData.unit,
        location: readingData.location,
        timestamp: new Date(),
      },
    });

    // Check for anomalies and create alerts if needed
    await this.checkReadingAnomalies(reading);

    return reading as SensorReading;
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<IoTDevice | null> {
    const device = await prisma.iot_devices.findUnique({
      where: { id: deviceId },
    });

    return device as IoTDevice | null;
  }

  /**
   * Get sensor readings for a device
   */
  async getSensorReadings(
    deviceId: string,
    type?: string,
    limit: number = 100
  ): Promise<SensorReading[]> {
    const readings = await prisma.sensor_readings.findMany({
      where: {
        deviceId,
        ...(type && { type }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return readings as SensorReading[];
  }

  /**
   * Create IoT alert
   */
  async createAlert(alertData: {
    deviceId: string;
    type: string;
    severity: string;
    message: string;
    data?: any;
  }): Promise<IoTAlert> {
    const alert = await prisma.iot_alerts.create({
      data: {
        id: `alert-${Date.now()}`,
        deviceId: alertData.deviceId,
        type: alertData.type,
        severity: alertData.severity,
        message: alertData.message,
        data: alertData.data ? JSON.stringify(alertData.data) : null,
        isResolved: false,
        createdAt: new Date(),
      },
    });

    // Send notifications for critical alerts
    if (alertData.severity === 'critical') {
      await this.notifyCriticalAlert(alert);
    }

    return alert as IoTAlert;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<IoTAlert> {
    const alert = await prisma.iot_alerts.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    return alert as IoTAlert;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(organizationId: string): Promise<IoTAlert[]> {
    const alerts = await prisma.iot_alerts.findMany({
      where: {
        isResolved: false,
        iot_devices: {
          organizationId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return alerts as IoTAlert[];
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    status: 'online' | 'offline' | 'maintenance' | 'error'
  ): Promise<void> {
    await prisma.iot_devices.update({
      where: { id: deviceId },
      data: {
        status,
        lastSeen: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create alert if device went offline
    if (status === 'offline') {
      await this.createAlert({
        deviceId,
        type: 'device_offline',
        severity: 'medium',
        message: `Device ${deviceId} went offline`,
      });
    }
  }

  /**
   * Get all devices for organization
   */
  async getDevices(organizationId: string): Promise<IoTDevice[]> {
    const devices = await prisma.iot_devices.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devices as IoTDevice[];
  }

  /**
   * Check for reading anomalies
   */
  private async checkReadingAnomalies(reading: any): Promise<void> {
    // Temperature anomaly detection
    if (reading.type === 'temperature' && (reading.value < 0 || reading.value > 50)) {
      await this.createAlert({
        deviceId: reading.deviceId,
        type: 'sensor_anomaly',
        severity: reading.value < -10 || reading.value > 60 ? 'critical' : 'high',
        message: `Abnormal temperature reading: ${reading.value}${reading.unit}`,
        data: { reading },
      });
    }

    // Weight anomaly detection
    if (reading.type === 'weight' && reading.value < 0) {
      await this.createAlert({
        deviceId: reading.deviceId,
        type: 'sensor_anomaly',
        severity: 'medium',
        message: `Negative weight reading detected`,
        data: { reading },
      });
    }
  }

  /**
   * Send critical alert notifications
   */
  private async notifyCriticalAlert(alert: any): Promise<void> {
    try {
      // Get device details
      const device = await prisma.iot_devices.findUnique({
        where: { id: alert.deviceId },
      });

      if (!device) return;

      // Get organization admins
      const admins = await prisma.user.findMany({
        where: {
          organizationId: device.organizationId,
          role: { in: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
        },
      });

      // Send email notifications
      for (const admin of admins) {
        if (admin.email) {
          await emailService.sendEmail({
            to: admin.email,
            subject: `Critical IoT Alert: ${alert.type}`,
            htmlContent: `
              <h2>Critical IoT Alert</h2>
              <p><strong>Device:</strong> ${device.name}</p>
              <p><strong>Alert Type:</strong> ${alert.type}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Location:</strong> ${device.location}</p>
              <p><strong>Time:</strong> ${alert.createdAt}</p>
            `,
          });
        }

        // Send SMS for critical alerts
        if (admin.phone) {
          await smsService.sendSMS({
            to: admin.phone,
            message: `CRITICAL: ${device.name} - ${alert.message}`,
          });
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Monitor device health
   */
  async monitorDeviceHealth(deviceId: string): Promise<{
    status: string;
    health: 'good' | 'fair' | 'poor';
    issues: string[];
  }> {
    const device = await prisma.iot_devices.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error('Device not found');
    }

    const issues: string[] = [];
    let health: 'good' | 'fair' | 'poor' = 'good';

    // Check battery level
    if (device.batteryLevel !== null && device.batteryLevel < 20) {
      issues.push('Low battery');
      health = device.batteryLevel < 10 ? 'poor' : 'fair';
    }

    // Check last seen
    if (device.lastSeen) {
      const hoursSinceLastSeen = 
        (Date.now() - device.lastSeen.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSeen > 24) {
        issues.push('Not seen in 24+ hours');
        health = 'poor';
      } else if (hoursSinceLastSeen > 1) {
        issues.push('Infrequent communication');
        if (health === 'good') health = 'fair';
      }
    }

    // Check for recent errors
    const recentAlerts = await prisma.iot_alerts.count({
      where: {
        deviceId,
        isResolved: false,
        severity: { in: ['high', 'critical'] },
      },
    });

    if (recentAlerts > 0) {
      issues.push(`${recentAlerts} unresolved alerts`);
      health = 'poor';
    }

    return {
      status: device.status,
      health,
      issues,
    };
  }
}

export const productionIoTService = new ProductionIoTService();

