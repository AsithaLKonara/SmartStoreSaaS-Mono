import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export class IoTService {
    /**
     * Register or update an IoT device
     */
    static async registerDevice(data: {
        deviceId: string;
        organizationId: string;
        name: string;
        type: string;
        location: string;
        metadata?: any;
    }) {
        const { deviceId, organizationId, name, type, location, metadata } = data;

        return prisma.iot_devices.upsert({
            where: { id: deviceId },
            update: {
                name,
                type,
                location,
                status: 'online',
                lastSeen: new Date(),
                metadata: metadata ? JSON.stringify(metadata) : undefined,
            },
            create: {
                id: deviceId,
                organizationId,
                name,
                type,
                location,
                status: 'online',
                lastSeen: new Date(),
                metadata: metadata ? JSON.stringify(metadata) : undefined,
                macAddress: 'unknown', // Placeholder
                firmwareVersion: '1.0.0', // Placeholder
                updatedAt: new Date()
            }
        });
    }

    /**
     * Ingest a sensor reading and trigger AI Triage if needed
     */
    static async ingestReading(data: {
        deviceId: string;
        type: string;
        value: number;
        unit: string;
        organizationId: string;
    }) {
        const { deviceId, type, value, unit, organizationId } = data;

        // 1. Persist Reading
        await prisma.sensor_readings.create({
            data: {
                id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                deviceId,
                type,
                value,
                unit,
                location: 'unknown', // Ideally fetched from device
                timestamp: new Date()
            }
        });

        // 2. Threshold Check (Basic Heuristic)
        let alertSeverity = null;
        let alertMessage = null;

        if (type === 'TEMPERATURE' && unit === 'C') {
            if (value > 10) { alertSeverity = 'HIGH'; alertMessage = `Temperature critical: ${value}°C`; }
            else if (value > 5) { alertSeverity = 'MEDIUM'; alertMessage = `Temperature warning: ${value}°C`; }
        } else if (type === 'HUMIDITY' && value > 70) {
            alertSeverity = 'MEDIUM'; alertMessage = `Humidity warning: ${value}%`;
        }

        // 3. AI Triage if Alert detected
        if (alertSeverity) {
            await this.createIncident(deviceId, organizationId, type, alertSeverity, alertMessage!);

            // Trigger AI Orchestrator for HIGH severity
            if (alertSeverity === 'HIGH') {
                await AIOrchestrator.handleIoTIncident(organizationId, {
                    deviceId,
                    type,
                    value,
                    severity: alertSeverity,
                    message: alertMessage!
                });
            }
        }
    }

    private static async createIncident(deviceId: string, organizationId: string, type: string, severity: string, message: string) {
        // Check if open alert exists to avoid spam
        const existing = await prisma.iot_alerts.findFirst({
            where: {
                deviceId,
                type,
                isResolved: false
            }
        });

        if (!existing) {
            await prisma.iot_alerts.create({
                data: {
                    id: `alert-${Date.now()}`,
                    deviceId,
                    type,
                    severity,
                    message,
                    isResolved: false
                }
            });

            logger.warn({ message: 'IoT Alert Created', context: { deviceId, severity, message } });
        }
    }

    /**
     * Get active alerts for an organization
     */
    static async getActiveAlerts(organizationId: string) {
        return prisma.iot_alerts.findMany({
            where: {
                iot_devices: { organizationId },
                isResolved: false
            },
            include: {
                iot_devices: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
