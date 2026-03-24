import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Service to aggregate sales data into daily snapshots.
 * Prevents expensive 'SELECT SUM(total)' queries on large live tables.
 */
export class AnalyticsSnapshotService {
  
  static async generateDailySnapshot(date: Date, organizationId?: string) {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // 1. Calculate Aggregates
      const salesAggregate = await prisma.order.aggregate({
        where: {
          organizationId: organizationId || undefined,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ['DELIVERED', 'SHIPPED', 'COMPLETED'] }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // 2. Upsert the Snapshot
      await prisma.dailySalesSnapshot.upsert({
        where: {
          organizationId_date: {
            organizationId: organizationId || null,
            date: startOfDay,
          }
        },
        update: {
          totalSales: salesAggregate._sum.total || 0,
          orderCount: salesAggregate._count.id || 0,
        },
        create: {
          organizationId: organizationId || null,
          date: startOfDay,
          totalSales: salesAggregate._sum.total || 0,
          orderCount: salesAggregate._count.id || 0,
        }
      });

      logger.info({ 
        message: `Daily snapshot generated for ${organizationId || 'PLATFORM'} on ${startOfDay.toISOString()}`,
        context: { totalSales: salesAggregate._sum.total, orderCount: salesAggregate._count.id }
      });

    } catch (error) {
      logger.error({ 
        message: `Failed to generate daily snapshot for ${organizationId || 'PLATFORM'}`, 
        error 
      });
    }
  }

  /**
   * Run snapshots for all active organizations
   */
  static async syncAllActiveTenants(date: Date) {
    const tenants = await prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    // Sync platform-wide
    await this.generateDailySnapshot(new Date(date));

    // Sync individual tenants
    for (const tenant of tenants) {
      await this.generateDailySnapshot(new Date(date), tenant.id);
    }
  }
}
