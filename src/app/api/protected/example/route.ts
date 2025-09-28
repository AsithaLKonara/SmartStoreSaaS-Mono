import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';

// Example protected API route
async function handler(request: AuthRequest) {
  try {
    const user = request.user!;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'read';

    switch (request.method) {
      case 'GET':
        return NextResponse.json({
          message: 'Protected endpoint accessed successfully',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
          },
          action,
          timestamp: new Date().toISOString(),
          permissions: {
            canReadUsers: user.role === ROLES.ADMIN || user.role === ROLES.MANAGER,
            canWriteUsers: user.role === ROLES.ADMIN,
            canDeleteUsers: user.role === ROLES.SUPER_ADMIN,
          }
        });

      case 'POST':
        // Only admins can create
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
          return NextResponse.json(
            { error: 'Insufficient permissions for POST operation' },
            { status: 403 }
          );
        }

        const body = await request.json();
        return NextResponse.json({
          message: 'Protected POST endpoint accessed successfully',
          user: user,
          data: body,
          timestamp: new Date().toISOString(),
        });

      case 'PUT':
        // Only admins and managers can update
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER && user.role !== ROLES.SUPER_ADMIN) {
          return NextResponse.json(
            { error: 'Insufficient permissions for PUT operation' },
            { status: 403 }
          );
        }

        const updateBody = await request.json();
        return NextResponse.json({
          message: 'Protected PUT endpoint accessed successfully',
          user: user,
          data: updateBody,
          timestamp: new Date().toISOString(),
        });

      case 'DELETE':
        // Only super admins can delete
        if (user.role !== ROLES.SUPER_ADMIN) {
          return NextResponse.json(
            { error: 'Insufficient permissions for DELETE operation' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          message: 'Protected DELETE endpoint accessed successfully',
          user: user,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Protected endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the handler with authentication middleware
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.USERS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.USERS_WRITE],
});

export const PUT = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.USERS_WRITE],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.SUPER_ADMIN,
  requiredPermissions: [PERMISSIONS.USERS_DELETE],
});
