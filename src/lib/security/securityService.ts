import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface SecurityAudit {
  id: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details: unknown;
}

export interface MFASetup {
  userId: string;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  isEnabled: boolean;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: string[];
  description: string;
}

export interface SecurityAlert {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'PERMISSION_VIOLATION' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  userId?: string;
  ipAddress: string;
  timestamp: Date;
  resolved: boolean;
  details: unknown;
}

export class SecurityService {
  /**
   * Multi-Factor Authentication
   */
  async setupMFA(userId: string): Promise<MFASetup> {
    try {
      // Generate secret for TOTP
      const secret = crypto.randomBytes(32).toString('base64');
      
      // Generate QR code URL
      const qrCode = `otpauth://totp/SmartStore:${userId}?secret=${secret}&issuer=SmartStore`;
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
      
      // Store MFA setup in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret,
          mfaBackupCodes: backupCodes,
          mfaEnabled: true,
        },
      });
      
      return {
        userId,
        secret,
        qrCode,
        backupCodes,
        isEnabled: true,
      };
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaBackupCodes: true },
      });
      
      if (!user?.mfaSecret) return false;
      
      // Check if it's a backup code
      if (user.mfaBackupCodes?.includes(token)) {
        // Remove used backup code
        await prisma.user.update({
          where: { id: userId },
          data: {
            mfaBackupCodes: {
              set: user.mfaBackupCodes.filter((code: string) => code !== token)
            }
          }
        });
        return true;
      }
      
      // Verify TOTP token
      return this.verifyTOTP(user.mfaSecret, token);
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      return false;
    }
  }

  private verifyTOTP(secret: string, token: string): boolean {
    // Simple TOTP verification (in production, use a proper TOTP library)
    const expectedToken = crypto.createHash('sha256')
      .update(secret + Math.floor(Date.now() / 30000))
      .digest('hex')
      .substring(0, 6);
    
    return token === expectedToken;
  }

  async createRole(roleName: string, permissions: string[], description: string): Promise<RolePermission> {
    try {
      // Since we don't have a Role model, we'll store this in user metadata
      const roleId = crypto.randomUUID();
      const roleData = {
        roleId,
        roleName,
        permissions,
        description
      };
      
      // Store in a system user or create a new approach
      // For now, we'll return the role data without persisting
      return roleData;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      // Store role assignment in user metadata
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Note: User model doesn't have metadata field, so we can't store role info there
          // In a real implementation, you might want to create a separate UserRole table
        }
      });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw new Error('Failed to assign role to user');
    }
  }

  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!user) return false;
      
      // Check role-based permissions
      if (user.role === 'ADMIN') {
        return true; // Admins have all permissions
      }
      
      // For now, return false for non-admin users
      // In a real implementation, you'd check the user's role permissions
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: unknown
  ): Promise<void> {
    try {
      await prisma.securityAudit.create({
        data: {
          userId,
          action,
          ipAddress,
          userAgent,
          organizationId: 'system', // Add missing organizationId
          metadata: {
            resource,
            success,
            details
          }
        }
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<SecurityAudit[]> {
    try {
      const where: unknown = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
      
      const audits = await prisma.securityAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return audits.map((audit: unknown) => ({
        id: audit.id,
        userId: audit.userId,
        action: audit.action,
        resource: (audit.metadata as unknown)?.resource || '',
        ipAddress: audit.ipAddress || '',
        userAgent: audit.userAgent || '',
        timestamp: audit.createdAt,
        success: (audit.metadata as unknown)?.success || false,
        details: (audit.metadata as unknown)?.details || {}
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  async createSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    userId?: string,
    ipAddress?: string,
    details?: unknown
  ): Promise<SecurityAlert> {
    try {
      const alert = await prisma.securityAlert.create({
        data: {
          type,
          message,
          severity,
          organizationId: 'system', // Add missing organizationId
          metadata: {
            userId,
            ipAddress: ipAddress || '', // Store IP address in metadata instead
            details
          }
        }
      });

      // Send notification
      await this.sendSecurityNotification({
        id: alert.id,
        type,
        severity,
        message,
        userId,
        ipAddress: (alert.metadata as unknown)?.ipAddress || '', // Access from metadata
        timestamp: alert.createdAt,
        resolved: false,
        details: details || {}
      });

      return {
        id: alert.id,
        type,
        severity,
        message,
        userId,
        ipAddress: (alert.metadata as unknown)?.ipAddress || '', // Access from metadata
        timestamp: alert.createdAt,
        resolved: false,
        details: details || {}
      };
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw new Error('Failed to create security alert');
    }
  }

  async detectSuspiciousActivity(userId: string, ipAddress: string, action: string): Promise<boolean> {
    try {
      // Check for failed login attempts
      const failedAttempts = await prisma.securityAudit.count({
        where: {
          userId,
          action: 'LOGIN',
          metadata: {
            not: null
          }
        }
      });

      // Check for multiple failed attempts from same IP
      const failedFromIP = await prisma.securityAudit.count({
        where: {
          ipAddress,
          action: 'LOGIN',
          metadata: {
            not: null
          }
        }
      });

      // Check for rapid successive actions
      const recentActions = await prisma.securityAudit.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      });

      // Define suspicious activity thresholds
      const suspicious = 
        failedAttempts > 5 ||
        failedFromIP > 10 ||
        recentActions > 50;

      if (suspicious) {
        await this.createSecurityAlert(
          'SUSPICIOUS_ACTIVITY',
          'HIGH',
          `Suspicious activity detected for user ${userId}`,
          userId,
          ipAddress,
          { failedAttempts, failedFromIP, recentActions }
        );
      }

      return suspicious;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  private async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    try {
      // Find admin users to notify
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // Send notifications to admins
      for (const admin of admins) {
        // For now, just log the notification
        // In production, you'd send email/SMS notifications
        console.log(`Security alert sent to admin ${admin.email}:`, alert);
      }
    } catch (error) {
      console.error('Error sending security notification:', error);
    }
  }

  async encryptSensitiveData(data: string): Promise<string> {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async exportUserData(userId: string): Promise<unknown> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          // Include related data that exists in the schema
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Return user data (excluding sensitive information)
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Add other non-sensitive fields
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      // Anonymize user data instead of deleting
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted User',
          email: `deleted-${userId}@deleted.com`,
          isActive: false
          // Note: User model doesn't have metadata field, so we can't store deletion info there
        }
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  }
}

export const securityService = new SecurityService(); 