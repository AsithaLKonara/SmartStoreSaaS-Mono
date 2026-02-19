import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class AuditService {
    /**
     * Create a security or compliance audit log
     */
    static async log(params: {
        userId: string;
        organizationId: string;
        action: string;
        resource: string;
        resourceId?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            return await prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    organizationId: params.organizationId,
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    details: params.details,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                }
            });
        } catch (error) {
            logger.error({
                message: 'Failed to create audit log',
                error: error instanceof Error ? error : new Error(String(error)),
                context: params
            });
        }
    }

    /**
     * Fetch audit logs for compliance review
     */
    static async getLogs(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        resource?: string;
    }) {
        const { organizationId, page = 1, limit = 50, userId, action, resource } = params;
        const skip = (page - 1) * limit;

        const where: any = { organizationId };
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (resource) where.resource = resource;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}
