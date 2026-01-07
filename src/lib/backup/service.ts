/**
 * Backup and Restore Service
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface BackupData {
  version: string;
  timestamp: string;
  organizationId: string;
  data: {
    products?: any[];
    customers?: any[];
    orders?: any[];
    categories?: any[];
    users?: any[];
  };
}

/**
 * Create a full backup
 */
export async function createBackup(organizationId: string): Promise<BackupData> {
  try {
    const [products, customers, orders, categories, users] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId },
        include: {
          category: true,
        },
      }),
      prisma.customer.findMany({
        where: { organizationId },
      }),
      prisma.order.findMany({
        where: { organizationId },
        include: {
          orderItems: true,
          customer: true,
        },
      }),
      prisma.category.findMany({
        where: { organizationId },
      }),
      prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      organizationId,
      data: {
        products,
        customers,
        orders,
        categories,
        users,
      },
    };

    return backup;
  } catch (error) {
    logger.error({
      message: 'Backup creation error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'BackupService', operation: 'createBackup', organizationId }
    });
    throw new Error('Failed to create backup');
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(
  backupData: BackupData,
  options: {
    clearExisting?: boolean;
    skipUsers?: boolean;
  } = {}
): Promise<{
  success: boolean;
  restored: Record<string, number>;
  errors: string[];
}> {
  const restored: Record<string, number> = {};
  const errors: string[] = [];

  try {
    if (options.clearExisting) {
      // WARNING: This deletes all existing data!
      await prisma.order.deleteMany({
        where: { organizationId: backupData.organizationId },
      });
      await prisma.product.deleteMany({
        where: { organizationId: backupData.organizationId },
      });
      await prisma.customer.deleteMany({
        where: { organizationId: backupData.organizationId },
      });
      await prisma.category.deleteMany({
        where: { organizationId: backupData.organizationId },
      });
    }

    // Restore categories first
    if (backupData.data.categories) {
      try {
        for (const category of backupData.data.categories) {
          await prisma.category.upsert({
            where: { id: category.id },
            update: category,
            create: category,
          });
        }
        restored.categories = backupData.data.categories.length;
      } catch (error: any) {
        errors.push(`Categories: ${error.message}`);
      }
    }

    // Restore customers
    if (backupData.data.customers) {
      try {
        for (const customer of backupData.data.customers) {
          await prisma.customer.upsert({
            where: { id: customer.id },
            update: customer,
            create: customer,
          });
        }
        restored.customers = backupData.data.customers.length;
      } catch (error: any) {
        errors.push(`Customers: ${error.message}`);
      }
    }

    // Restore products
    if (backupData.data.products) {
      try {
        for (const product of backupData.data.products) {
          const { category, ...productData } = product;
          await prisma.product.upsert({
            where: { id: product.id },
            update: productData,
            create: productData,
          });
        }
        restored.products = backupData.data.products.length;
      } catch (error: any) {
        errors.push(`Products: ${error.message}`);
      }
    }

    // Restore orders (complex - be careful!)
    if (backupData.data.orders) {
      try {
        for (const order of backupData.data.orders) {
          const { orderItems, customer, ...orderData } = order;
          await prisma.order.upsert({
            where: { id: order.id },
            update: orderData,
            create: orderData,
          });

          // Restore order items
          if (orderItems) {
            for (const item of orderItems) {
              await prisma.orderItem.upsert({
                where: { id: item.id },
                update: item,
                create: item,
              });
            }
          }
        }
        restored.orders = backupData.data.orders.length;
      } catch (error: any) {
        errors.push(`Orders: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      restored,
      errors,
    };
  } catch (error: any) {
    logger.error({
      message: 'Restore error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'BackupService', operation: 'restoreBackup', backupId }
    });
    return {
      success: false,
      restored,
      errors: [error.message],
    };
  }
}

/**
 * Export backup to JSON string
 */
export function exportBackupToJSON(backup: BackupData): string {
  return JSON.stringify(backup, null, 2);
}

/**
 * Import backup from JSON string
 */
export function importBackupFromJSON(json: string): BackupData {
  try {
    const backup = JSON.parse(json) as BackupData;
    
    // Validate structure
    if (!backup.version || !backup.timestamp || !backup.organizationId || !backup.data) {
      throw new Error('Invalid backup format');
    }

    return backup;
  } catch (error) {
    throw new Error('Failed to parse backup data');
  }
}

