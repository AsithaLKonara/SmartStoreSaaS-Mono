import { NextResponse } from 'next/server';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/iot/status
 * Get real-time status of all IoT devices and alerts for the organization
 */
export const GET = requirePermission('VIEW_ANALYTICS')(
    async (req: AuthenticatedRequest, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                throw new ValidationError('Organization scope required');
            }

            const [devices, alerts] = await Promise.all([
                prisma.iotDevice.findMany({
                    where: { organizationId },
                    orderBy: { lastSeen: 'desc' }
                }),
                prisma.iotAlert.findMany({
                    where: {
                        organizationId,
                        status: 'ACTIVE'
                    },
                    include: {
                        iotDevice: {
                            select: { name: true, location: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                })
            ]);

            return NextResponse.json(successResponse({
                devices,
                alerts,
                timestamp: new Date().toISOString()
            }));
        } catch (error: any) {
            return NextResponse.json({
                success: false,
                message: error.message || 'Failed to fetch IoT status'
            }, { status: 500 });
        }
    }
);
