import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { IoTService } from '@/lib/services/iot.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const telemetrySchema = z.object({
    deviceId: z.string(),
    type: z.string(),
    value: z.number(),
    unit: z.string(),
    organizationId: z.string(),
    secret: z.string() // Basic auth for devices
});

/**
 * POST /api/iot/telemetry
 * Ingest sensor data from edge devices
 */
export async function POST(req: NextRequest) {
    try {
        return NextResponse.json({ success: false, error: '501 Not Implemented: IoT Telemetry is disabled.' }, { status: 501 });
        const body = await req.json();
        const validation = telemetrySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid telemetry format' }, { status: 400 });
        }

        const { deviceId, type, value, unit, organizationId, secret } = validation.data;

        // TODO: Verify device secret against database
        // For now, we trust the device ID if it exists or register it on fly? 
        // We assume device is already registered or we auto-register.

        await IoTService.ingestReading({
            deviceId,
            type,
            value,
            unit,
            organizationId
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error({ message: 'Telemetry ingestion failed', error: error.message });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
