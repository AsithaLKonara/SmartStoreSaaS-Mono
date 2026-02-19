import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface AuditLogOptions {
    userId: string;
    organizationId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Audit Service for logging system and user actions
 */
export class AuditService {
    /**
     * Log an action to the audit_logs table
     */
    static async log(options: AuditLogOptions) {
        try {
            const log = await prisma.auditLog.create({
                data: {
                    userId: options.userId,
                    organizationId: options.organizationId,
                    action: options.action,
                    resource: options.resource,
                    resourceId: options.resourceId,
                    details: options.details ? JSON.stringify(options.details) : undefined,
                    ipAddress: options.ipAddress,
                    userAgent: options.userAgent
                }
            });

            logger.info({
                message: 'Audit log created',
                context: {
                    logId: log.id,
                    action: options.action,
                    resource: options.resource
                }
            });

            return log;
        } catch (error) {
            logger.error({
                message: 'Failed to create audit log',
                error: error instanceof Error ? error.message : String(error),
                context: { options }
            });
            // Don't throw - auditing should not break the main workflow
            return null;
        }
    }

    /**
     * Shorthand for common actions
     */
    static async logAuth(userId: string, orgId: string, action: 'LOGIN' | 'LOGOUT' | 'MFA_VERIFIED', ip?: string) {
        return this.log({
            userId,
            organizationId: orgId,
            action,
            resource: 'AUTH',
            ipAddress: ip
        });
    }

    static async logAccess(userId: string, orgId: string, resource: string, action: 'CREATE' | 'UPDATE' | 'DELETE', resourceId: string, details?: any) {
        return this.log({
            userId,
            organizationId: orgId,
            action,
            resource,
            resourceId,
            details
        });
    }
}
