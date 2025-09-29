import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const auditLogSchema = z.object({
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * GET /api/security/audit - Get audit logs with filtering and pagination
 */
async function getAuditLogs(request: AuthRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const severity = searchParams.get('severity');

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    };

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (severity) where.severity = severity;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get audit logs with pagination
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get audit statistics
    const stats = await getAuditStatistics(user.organizationId, {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        auditLogs: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          details: log.details ? JSON.parse(log.details) : {},
          userId: log.userId,
          user: log.user,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          severity: log.severity,
          timestamp: log.timestamp,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/audit - Create audit log entry
 */
async function createAuditLog(request: AuthRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate request body
    const validatedData = auditLogSchema.parse(body);
    
    // Get client information
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        action: validatedData.action,
        resource: validatedData.resource,
        resourceId: validatedData.resourceId,
        details: JSON.stringify(validatedData.details || {}),
        userId: user.id,
        organizationId: user.organizationId,
        ipAddress: validatedData.ipAddress || ipAddress,
        userAgent: validatedData.userAgent || userAgent,
        severity: determineSeverity(validatedData.action),
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: auditLog.id,
        message: 'Audit log created successfully',
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get audit statistics
 */
async function getAuditStatistics(organizationId: string, timeRange: { startDate: Date; endDate: Date }) {
  try {
    const where = {
      organizationId,
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    };

    // Get total audit logs
    const totalLogs = await prisma.auditLog.count({ where });

    // Get logs by action
    const logsByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });

    // Get logs by severity
    const logsBySeverity = await prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    });

    // Get logs by user
    const logsByUser = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      totalLogs,
      logsByAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      logsBySeverity: logsBySeverity.map(item => ({
        severity: item.severity,
        count: item._count.severity,
      })),
      topUsers: logsByUser.map(item => ({
        userId: item.userId,
        count: item._count.userId,
      })),
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        user: log.user,
        timestamp: log.timestamp,
        severity: log.severity,
      })),
    };
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    return {
      totalLogs: 0,
      logsByAction: [],
      logsBySeverity: [],
      topUsers: [],
      recentActivity: [],
    };
  }
}

/**
 * Determine severity level for audit log entry
 */
function determineSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalActions = ['delete', 'destroy', 'remove', 'terminate'];
  const highActions = ['update', 'modify', 'change', 'edit'];
  const mediumActions = ['create', 'add', 'import', 'export'];
  
  const actionLower = action.toLowerCase();
  
  if (criticalActions.some(ca => actionLower.includes(ca))) {
    return 'critical';
  }
  
  if (highActions.some(ha => actionLower.includes(ha))) {
    return 'high';
  }
  
  if (mediumActions.some(ma => actionLower.includes(ma))) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

// Export handlers with security permissions
export const GET = createAuthHandler(getAuditLogs, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.AUDIT_READ],
});

export const POST = createAuthHandler(createAuditLog, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.SECURITY_WRITE],
});
