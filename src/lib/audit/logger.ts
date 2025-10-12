/**
 * Audit Logging System
 */

import { prisma } from '@/lib/prisma';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditResource {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  CUSTOMER = 'CUSTOMER',
  PAYMENT = 'PAYMENT',
  SETTINGS = 'SETTINGS',
  API_KEY = 'API_KEY',
}

export interface AuditLogEntry {
  userId: string;
  organizationId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        organizationId: entry.organizationId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        details: entry.details || {},
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(filters: {
  organizationId: string;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.resource) {
    where.resource = filters.resource;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Helper functions for common audit operations
 */

export async function logProductAction(
  action: AuditAction,
  userId: string,
  organizationId: string,
  productId: string,
  details?: any
) {
  await createAuditLog({
    userId,
    organizationId,
    action,
    resource: AuditResource.PRODUCT,
    resourceId: productId,
    details,
  });
}

export async function logOrderAction(
  action: AuditAction,
  userId: string,
  organizationId: string,
  orderId: string,
  details?: any
) {
  await createAuditLog({
    userId,
    organizationId,
    action,
    resource: AuditResource.ORDER,
    resourceId: orderId,
    details,
  });
}

export async function logCustomerAction(
  action: AuditAction,
  userId: string,
  organizationId: string,
  customerId: string,
  details?: any
) {
  await createAuditLog({
    userId,
    organizationId,
    action,
    resource: AuditResource.CUSTOMER,
    resourceId: customerId,
    details,
  });
}

export async function logUserAction(
  action: AuditAction,
  userId: string,
  organizationId: string,
  targetUserId: string,
  details?: any
) {
  await createAuditLog({
    userId,
    organizationId,
    action,
    resource: AuditResource.USER,
    resourceId: targetUserId,
    details,
  });
}

