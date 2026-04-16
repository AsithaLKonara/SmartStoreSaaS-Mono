import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'WAREHOUSE', 'STAFF'])(
  async (req: AuthenticatedRequest, user) => {
    const organizationId = getOrganizationScope(user);

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      
      const deliveries = await prisma.delivery.findMany({
        where: {
          organizationId,
          ...(status && status !== 'all' ? { status: status as any } : {}),
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          },
          courier: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform to match the UI interface expected by CouriersPage
      const formattedDeliveries = deliveries.map(d => ({
        id: d.id,
        orderNumber: d.order?.orderNumber || 'N/A',
        customerName: d.order?.customer?.name || 'Unknown',
        customerPhone: d.order?.customer?.phone || 'N/A',
        address: (d.address as any)?.formatted || 'No Address',
        status: d.status,
        estimatedDeliveryTime: d.estimatedDelivery || d.createdAt,
        trackingNumber: d.trackingNumber || `TRK-${d.id.slice(0, 8).toUpperCase()}`,
        courierId: d.courierId,
        courierName: d.courier?.name || 'Unassigned',
        createdAt: d.createdAt
      }));

      return NextResponse.json({
        success: true,
        data: formattedDeliveries
      });

    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch deliveries',
        error: error.message,
        organizationId
      });
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  }
);
