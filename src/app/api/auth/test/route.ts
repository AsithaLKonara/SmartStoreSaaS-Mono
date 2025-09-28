import { NextResponse } from 'next/server';
import { createAuthHandler, ROLES, AuthRequest } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    return NextResponse.json({
      message: 'Authentication test successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      permissions: {
        canReadUsers: ['ADMIN', 'MANAGER'].includes(user.role),
        canWriteUsers: ['ADMIN', 'SUPER_ADMIN'].includes(user.role),
        canDeleteUsers: user.role === 'SUPER_ADMIN',
        canManageOrganization: ['ADMIN', 'SUPER_ADMIN'].includes(user.role),
        canViewAnalytics: true, // All authenticated users can view analytics
      },
      roleHierarchy: {
        current: user.role,
        level: {
          SUPER_ADMIN: 4,
          ADMIN: 3,
          MANAGER: 2,
          USER: 1,
        }[user.role as keyof typeof ROLES] || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { error: 'Authentication test failed' },
      { status: 500 }
    );
  }
}

// Export handler with authentication required
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
});