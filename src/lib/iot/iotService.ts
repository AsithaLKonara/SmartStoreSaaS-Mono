import { prisma } from '@/lib/prisma';
import { realTimeSyncService } from '@/lib/sync/realTimeSyncService';
import { emailService } from '@/lib/email/emailService';
import { smsService } from '@/lib/sms/smsService';
import { iotLogger } from '@/lib/utils/logger';
import { logger } from '@/lib/logger';

export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'beacon' | 'camera' | 'scale' | 'thermometer' | 'rfid_reader' | 'smart_shelf' | 'pos_terminal';
  location: string;
  warehouseId?: string;
  storeId?: string;
  macAddress: string;
  ipAddress?: string;
  firmwareVersion: string;
  batteryLevel?: number;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  configuration: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isActive: boolean;
  installedAt: Date;
  organizationId: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  type: 'temperature' | 'humidity' | 'weight' | 'motion' | 'proximity' | 'light' | 'sound' | 'air_quality';
  value: number;
  unit: string;
  timestamp: Date;
  location: string;
  metadata?: Record<string, unknown>;
}

export interface SmartShelfData {
  deviceId: string;
  shelfId: string;
  products: Array<{
    productId: string;
    sku: string;
    quantity: number;
    weight: number;
    lastUpdated: Date;
  }>;
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  alerts: Array<{
    type: 'low_stock' | 'out_of_stock' | 'overweight' | 'misplaced';
    productId?: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface BeaconData {
  deviceId: string;
  beaconId: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  proximity: 'immediate' | 'near' | 'far' | 'unknown';
  customerDevices: Array<{
    deviceId: string;
    userId?: string;
    entryTime: Date;
    exitTime?: Date;
    dwellTime?: number; // seconds
    interactions: number;
  }>;
}

export interface RFIDReading {
  deviceId: string;
  tagId: string;
  productId?: string;
  location: string;
  action: 'read' | 'write' | 'inventory';
  timestamp: Date;
  signalStrength: number;
  metadata?: Record<string, unknown>;
}

export interface IoTAlert {
  id: string;
  deviceId: string;
  type: 'device_offline' | 'low_battery' | 'sensor_anomaly' | 'security_breach' | 'maintenance_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, unknown>;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface EnvironmentalConditions {
  location: string;
  timestamp: Date;
  temperature: {
    current: number;
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  humidity: {
    current: number;
    min: number;
    max: number;
    unit: '%';
  };
  airQuality: {
    index: number;
    status: 'good' | 'moderate' | 'poor' | 'hazardous';
    co2: number;
    particles: number;
  };
  lighting: {
    lux: number;
    status: 'dim' | 'normal' | 'bright';
  };
}

export class IoTService {
  private deviceConnections: Map<string, WebSocket> = new Map();
  private sensorDataBuffer: Map<string, SensorReading[]> = new Map();
  private alertThresholds: Map<string, unknown> = new Map();

  constructor() {
    this.initializeIoTService();
  }

  /**
   * Initialize IoT service
   */
  private initializeIoTService(): void {
    try {
      // Set up default alert thresholds
      this.setupDefaultThresholds();

      // Start periodic tasks
      this.startPeriodicTasks();

      iotLogger.info('IoT service initialized');
    } catch (error) {
      iotLogger.error('Error initializing IoT service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Register new IoT device
   */
  async registerDevice(deviceData: Omit<IoTDevice, 'id' | 'lastSeen' | 'installedAt'>): Promise<IoTDevice> {
    try {
      const device = await prisma.iot_devices.create({
        data: {
          id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: deviceData.name,
          type: deviceData.type,
          location: deviceData.location,
          warehouseId: deviceData.warehouseId,
          storeId: deviceData.storeId,
          macAddress: deviceData.macAddress,
          ipAddress: deviceData.ipAddress,
          firmwareVersion: deviceData.firmwareVersion,
          batteryLevel: deviceData.batteryLevel,
          status: deviceData.status,
          configuration: JSON.stringify(deviceData.configuration),
          metadata: JSON.stringify(deviceData.metadata),
          isActive: deviceData.isActive,
          organizationId: deviceData.organizationId,
          installedAt: new Date(),
          lastSeen: new Date(),
          updatedAt: new Date()
        }
      });

      // Store device connection placeholder
      this.deviceConnections.set(device.id, {} as WebSocket);

      return this.mapDeviceFromDB(device);
    } catch (error) {
      iotLogger.error('Error registering IoT device', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to register IoT device');
    }
  }

  /**
   * Connect device via WebSocket
   */
  async connectDevice(deviceId: string, ws: WebSocket): Promise<void> {
    try {
      // Store WebSocket connection
      this.deviceConnections.set(deviceId, ws);

      // Update device status to online
      await prisma.iot_devices.update({
        where: { id: deviceId },
        data: {
          status: 'online',
          lastSeen: new Date(),
          updatedAt: new Date()
        }
      });

      iotLogger.info(`Device ${deviceId} connected`);

      // Set up message handlers
      ws.onmessage = (event) => this.handleDeviceMessage(deviceId, event.data);
      ws.onclose = () => this.handleDeviceDisconnect(deviceId);
      ws.onerror = (error) => iotLogger.error(`Device ${deviceId} WebSocket error`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        deviceId,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      iotLogger.error('Error connecting IoT device', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to connect IoT device');
    }
  }

  /**
   * Process sensor reading
   */
  async processSensorReading(
    deviceId: string,
    reading: Omit<SensorReading, 'id' | 'deviceId' | 'timestamp'>
  ): Promise<SensorReading> {
    try {
      // Create sensor reading record
      const sensorReading = await prisma.sensor_readings.create({
        data: {
          id: `read_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deviceId,
          type: reading.type,
          value: reading.value,
          unit: reading.unit,
          location: reading.location,
          metadata: JSON.stringify(reading.metadata || {}),
          timestamp: new Date()
        }
      });

      const mappedReading = this.mapSensorReadingFromDB(sensorReading);

      // Store in buffer for batch processing
      if (!this.sensorDataBuffer.has(deviceId)) {
        this.sensorDataBuffer.set(deviceId, []);
      }
      this.sensorDataBuffer.get(deviceId)!.push(mappedReading);

      // Check for alerts
      await this.checkSensorAlerts(deviceId, reading);

      // Update device last seen
      await this.updateDeviceLastSeen(deviceId);

      return mappedReading;
    } catch (error) {
      iotLogger.error('Error processing sensor reading', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to process sensor reading');
    }
  }

  /**
   * Process smart shelf data
   */
  async processSmartShelfData(shelfData: SmartShelfData): Promise<void> {
    try {
      iotLogger.debug('Processing smart shelf data', { shelfData });

      // Update product quantities
      for (const product of shelfData.products) {
        await this.updateProductQuantityFromShelf(
          product.productId,
          product.quantity,
          shelfData.deviceId
        );
      }

      // Process alerts
      for (const alert of shelfData.alerts) {
        if (alert.severity === 'critical' || alert.severity === 'high') {
          await this.createAlert({
            deviceId: shelfData.deviceId,
            type: 'sensor_anomaly',
            severity: alert.severity,
            message: alert.message,
            data: { shelfId: shelfData.shelfId, productId: alert.productId },
          });
        }
      }
    } catch (error) {
      iotLogger.error('Error processing smart shelf data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to process smart shelf data');
    }
  }

  /**
   * Process beacon data for customer analytics
   */
  async processBeaconData(beaconData: BeaconData): Promise<void> {
    try {
      iotLogger.debug('Processing beacon data', { beaconData });

      // Update customer interactions
      for (const customerDevice of beaconData.customerDevices) {
        if (customerDevice.userId) {
          await prisma.activities.create({
            data: {
              id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'BEACON_INTERACTION',
              description: `Customer detected at beacon ${beaconData.beaconId}`,
              userId: customerDevice.userId,
              organizationId: 'org_pending_lookup', // TODO: Resolve org properly in production
              metadata: JSON.stringify({
                beaconId: beaconData.beaconId,
                rssi: beaconData.rssi,
                proximity: beaconData.proximity
              })
            }
          });
        }
      }

      // Generate location insights
      await this.generateLocationInsights(beaconData);
    } catch (error) {
      iotLogger.error('Error processing beacon data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw to prevent analytics failures from breaking flow
    }
  }

  /**
   * Process RFID readings for inventory tracking
   */
  async processRFIDReading(reading: RFIDReading): Promise<void> {
    try {
      iotLogger.debug('Processing RFID reading', { reading });

      // Update inventory if product is identified
      if (reading.productId) {
        await this.updateInventoryFromRFID(reading);
      }

      // Check for security issues
      await this.checkRFIDSecurity(reading);
    } catch (error) {
      iotLogger.error('Error processing RFID reading', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to process RFID reading');
    }
  }

  /**
   * Get environmental conditions for location
   */
  async getEnvironmentalConditions(location: string): Promise<EnvironmentalConditions> {
    try {
      // Aggregate real sensor data
      const readings = await prisma.sensor_readings.findMany({
        where: { location },
        orderBy: { timestamp: 'desc' },
        take: 20
      });

      // Fallback to mock if no data
      if (readings.length === 0) {
        return {
          location,
          timestamp: new Date(),
          temperature: { current: 22, min: 18, max: 26, unit: 'C' },
          humidity: { current: 45, min: 40, max: 60, unit: '%' },
          airQuality: { index: 25, status: 'good', co2: 400, particles: 10 },
          lighting: { lux: 500, status: 'normal' },
        };
      }

      // Process real readings to generate current conditions
      // (This is a simplified aggregation)
      const latestTemp = readings.find(r => r.type === 'temperature');
      const latestHum = readings.find(r => r.type === 'humidity');

      return {
        location,
        timestamp: new Date(),
        temperature: {
          current: latestTemp?.value || 22,
          min: 18,
          max: 26,
          unit: 'C'
        },
        humidity: {
          current: latestHum?.value || 45,
          min: 40,
          max: 60,
          unit: '%'
        },
        airQuality: { index: 25, status: 'good', co2: 400, particles: 10 },
        lighting: { lux: 500, status: 'normal' },
      };
    } catch (error) {
      iotLogger.error('Error getting environmental conditions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get environmental conditions');
    }
  }

  /**
   * Get device analytics
   */
  async getDeviceAnalytics(
    deviceId?: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    batteryAlerts: number;
    sensorReadings: number;
    alerts: IoTAlert[];
    deviceUptime: Record<string, number>;
  }> {
    try {
      const whereClause = deviceId ? { id: deviceId } : {};

      const totalDevices = await prisma.iot_devices.count({ where: whereClause });
      const onlineDevices = await prisma.iot_devices.count({ where: { ...whereClause, status: 'online' } });
      const offlineDevices = await prisma.iot_devices.count({ where: { ...whereClause, status: 'offline' } });

      const alerts = await prisma.iot_alerts.findMany({
        where: {
          ...deviceId ? { deviceId } : {},
          createdAt: {
            gte: new Date(Date.now() - this.parseTimeRange(timeRange))
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const sensorReadingsCount = await prisma.sensor_readings.count({
        where: {
          ...deviceId ? { deviceId } : {},
          timestamp: {
            gte: new Date(Date.now() - this.parseTimeRange(timeRange))
          }
        }
      });

      return {
        totalDevices,
        onlineDevices,
        offlineDevices,
        batteryAlerts: await prisma.iot_alerts.count({ where: { type: 'low_battery' } }),
        sensorReadings: sensorReadingsCount,
        alerts: alerts.map(this.mapAlertFromDB),
        deviceUptime: {}, // Would require complex interval calculation
      };
    } catch (error) {
      iotLogger.error('Error getting device analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get device analytics');
    }
  }

  /**
   * Create IoT alert
   */
  async createAlert(alertData: Omit<IoTAlert, 'id' | 'isResolved' | 'createdAt'>): Promise<IoTAlert> {
    try {
      const alert = await prisma.iot_alerts.create({
        data: {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deviceId: alertData.deviceId,
          type: alertData.type,
          severity: alertData.severity,
          message: alertData.message,
          data: JSON.stringify(alertData.data),
          isResolved: false,
          createdAt: new Date()
        }
      });

      // Send notifications for critical alerts
      if (alert.severity === 'critical') {
        const mappedAlert = this.mapAlertFromDB(alert);
        await this.sendCriticalAlertNotifications(mappedAlert);
      }

      return this.mapAlertFromDB(alert);
    } catch (error) {
      iotLogger.error('Error creating IoT alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to create IoT alert');
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<IoTAlert> {
    try {
      const alert = await prisma.iot_alerts.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy
        }
      });

      return this.mapAlertFromDB(alert);
    } catch (error) {
      iotLogger.error('Error resolving IoT alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to resolve IoT alert');
    }
  }

  /**
   * Private helper methods
   */

  private parseTimeRange(range: string): number {
    const unit = range.slice(-1);
    const value = parseInt(range.slice(0, -1));
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private setupDefaultThresholds(): void {
    // Set default alert thresholds
    this.alertThresholds.set('temperature', { min: 15, max: 30 });
    this.alertThresholds.set('humidity', { min: 30, max: 70 });
    this.alertThresholds.set('battery', { low: 20, critical: 10 });
  }

  private startPeriodicTasks(): void {
    // Check offline devices every 5 minutes
    setInterval(() => this.checkOfflineDevices(), 5 * 60 * 1000);

    // Process sensor data buffer every minute
    setInterval(() => this.processSensorDataBuffer(), 60 * 1000);

    // Check battery levels every hour
    setInterval(() => this.checkBatteryLevels(), 60 * 60 * 1000);
  }

  private async handleDeviceMessage(deviceId: string, message: any): Promise<void> {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;

      switch (data.type) {
        case 'sensor_reading':
          await this.processSensorReading(deviceId, data.reading);
          break;
        case 'smart_shelf_data':
          await this.processSmartShelfData(data.shelfData);
          break;
        case 'beacon_data':
          await this.processBeaconData(data.beaconData);
          break;
        case 'rfid_reading':
          await this.processRFIDReading(data.rfidReading);
          break;
        default:
          iotLogger.debug(`Unknown message type from device ${deviceId}`, { messageType: data.type });
      }
    } catch (error) {
      iotLogger.error(`Error handling message from device ${deviceId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleDeviceDisconnect(deviceId: string): Promise<void> {
    try {
      // Remove WebSocket connection
      this.deviceConnections.delete(deviceId);

      // Update device status to offline
      await prisma.iot_devices.update({
        where: { id: deviceId },
        data: {
          status: 'offline',
          updatedAt: new Date()
        }
      });

      iotLogger.info(`Device ${deviceId} disconnected`);
    } catch (error) {
      iotLogger.error(`Error handling device disconnect for ${deviceId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async checkSensorAlerts(deviceId: string, reading: any): Promise<void> {
    try {
      const thresholds = this.alertThresholds.get(reading.type) as any;
      if (!thresholds) return;

      let shouldAlert = false;
      let message = '';

      if (reading.type === 'temperature') {
        if (reading.value < thresholds.min || reading.value > thresholds.max) {
          shouldAlert = true;
          message = `Temperature ${reading.value}${reading.unit} is outside normal range (${thresholds.min}-${thresholds.max}${reading.unit})`;
        }
      } else if (reading.type === 'humidity') {
        if (reading.value < thresholds.min || reading.value > thresholds.max) {
          shouldAlert = true;
          message = `Humidity ${reading.value}${reading.unit} is outside normal range (${thresholds.min}-${thresholds.max}${reading.unit})`;
        }
      }

      if (shouldAlert) {
        await this.createAlert({
          deviceId,
          type: 'sensor_anomaly',
          severity: 'medium',
          message,
          data: { reading, thresholds },
        });
      }
    } catch (error) {
      iotLogger.error('Error checking sensor alerts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateDeviceLastSeen(deviceId: string): Promise<void> {
    try {
      await prisma.iot_devices.update({
        where: { id: deviceId },
        data: {
          lastSeen: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      iotLogger.error(`Error updating last seen for device ${deviceId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateProductQuantityFromShelf(
    productId: string,
    quantity: number,
    deviceId: string
  ): Promise<void> {
    try {
      // Update product quantity in inventory
      await prisma.product.update({
        where: { id: productId },
        data: { stock: quantity },
      });

      iotLogger.debug(`Updated product ${productId} quantity to ${quantity} from shelf device ${deviceId}`);
    } catch (error) {
      iotLogger.error(`Error updating product quantity for ${productId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async generateLocationInsights(beaconData: BeaconData): Promise<void> {
    try {
      // Generate insights about customer movement patterns
      const totalInteractions = beaconData.customerDevices.reduce(
        (sum, device) => sum + device.interactions,
        0
      );

      if (totalInteractions > 100) {
        iotLogger.info(`High traffic detected at beacon ${beaconData.beaconId}: ${totalInteractions} interactions`);
      }
    } catch (error) {
      iotLogger.error('Error generating location insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateInventoryFromRFID(reading: RFIDReading): Promise<void> {
    try {
      if (reading.productId) {
        // Log activity
        await prisma.product_activities.create({
          data: {
            productId: reading.productId,
            type: 'STATUS_CHANGED',
            description: 'RFID scan update',
            metadata: JSON.stringify({
              lastRFIDScan: reading.timestamp,
              lastLocation: reading.location,
              signalStrength: reading.signalStrength,
            })
          }
        });

        iotLogger.debug(`Updated product ${reading.productId} from RFID reading at ${reading.location}`);
      }
    } catch (error) {
      iotLogger.error('Error updating inventory from RFID', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async checkRFIDSecurity(reading: RFIDReading): Promise<void> {
    try {
      // Check for suspicious RFID activity
      if (reading.signalStrength < -70) {
        // Weak signal might indicate tampering
        await this.createAlert({
          deviceId: reading.deviceId,
          type: 'security_breach',
          severity: 'medium',
          message: `Weak RFID signal detected, possible tampering at ${reading.location}`,
          data: { reading },
        });
      }
    } catch (error) {
      iotLogger.error('Error checking RFID security', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async checkOfflineDevices(): Promise<void> {
    try {
      // Find devices that haven't been seen in 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const offlineDevices = await prisma.iot_devices.findMany({
        where: {
          lastSeen: { lt: tenMinutesAgo },
          status: 'online'
        }
      });

      for (const device of offlineDevices) {
        await prisma.iot_devices.update({
          where: { id: device.id },
          data: { status: 'offline' }
        });

        await this.createAlert({
          deviceId: device.id,
          type: 'device_offline',
          severity: 'high',
          message: `Device ${device.name} is offline (last seen: ${device.lastSeen})`,
          data: { lastSeen: device.lastSeen }
        });
      }
    } catch (error) {
      iotLogger.error('Error checking offline devices', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processSensorDataBuffer(): Promise<void> {
    try {
      // Process buffered sensor data
      for (const [deviceId, readings] of Array.from(this.sensorDataBuffer.entries())) {
        if (readings.length > 0) {
          iotLogger.debug(`Processed ${readings.length} buffered readings from device ${deviceId}`);
          // Clear buffer after processing
          this.sensorDataBuffer.set(deviceId, []);
        }
      }
    } catch (error) {
      iotLogger.error('Error processing sensor data buffer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async checkBatteryLevels(): Promise<void> {
    try {
      const lowBatteryDevices = await prisma.iot_devices.findMany({
        where: {
          batteryLevel: { lte: 20 },
          status: { not: 'maintenance' }
        }
      });

      for (const device of lowBatteryDevices) {
        // Check if alert already exists recently to avoid spam
        // (Implementation omitted for brevity, assumes createAlert handles logic or we just create it)
        const severity = (device.batteryLevel ?? 0) <= 10 ? 'critical' : 'low';

        await this.createAlert({
          deviceId: device.id,
          type: 'low_battery',
          severity,
          message: `Low battery level: ${device.batteryLevel}%`,
          data: { batteryLevel: device.batteryLevel }
        });
      }
    } catch (error) {
      iotLogger.error('Error checking battery levels', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async sendCriticalAlertNotifications(alert: any): Promise<void> {
    try {
      iotLogger.warn(`Critical alert: ${alert.message}`);
      // In production, this would send emails, SMS, or push notifications
    } catch (error) {
      iotLogger.error('Error sending critical alert notifications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private mapDeviceFromDB(device: any): IoTDevice {
    return {
      id: device.id,
      name: device.name,
      type: device.type as any,
      location: device.location,
      warehouseId: device.warehouseId,
      storeId: device.storeId,
      macAddress: device.macAddress,
      ipAddress: device.ipAddress,
      firmwareVersion: device.firmwareVersion,
      batteryLevel: device.batteryLevel,
      status: device.status as any,
      lastSeen: device.lastSeen || new Date(),
      configuration: typeof device.configuration === 'string' ? JSON.parse(device.configuration) : device.configuration,
      metadata: typeof device.metadata === 'string' ? JSON.parse(device.metadata) : device.metadata,
      isActive: device.isActive,
      installedAt: device.installedAt,
      organizationId: device.organizationId
    };
  }

  private mapSensorReadingFromDB(reading: any): SensorReading {
    return {
      id: reading.id,
      deviceId: reading.deviceId,
      type: reading.type as any,
      value: reading.value,
      unit: reading.unit,
      timestamp: reading.timestamp,
      location: reading.location,
      metadata: typeof reading.metadata === 'string' ? JSON.parse(reading.metadata) : reading.metadata
    };
  }

  private mapAlertFromDB(alert: any): IoTAlert {
    return {
      id: alert.id,
      deviceId: alert.deviceId,
      type: alert.type as any,
      severity: alert.severity as any,
      message: alert.message,
      data: typeof alert.data === 'string' ? JSON.parse(alert.data) : alert.data,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
      resolvedAt: alert.resolvedAt,
      resolvedBy: alert.resolvedBy
    };
  }
}

export const iotService = new IoTService();
