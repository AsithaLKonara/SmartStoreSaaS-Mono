import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

async function handler(request: AuthRequest, { params }: RouteParams) {
  try {
    const user = request.user!;
    const { id } = params;

    switch (request.method) {
      case 'GET':
        // Get specific user
        const targetUser = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            emailVerified: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ user: targetUser });

      case 'PUT':
        // Update user
        const updateBody = await request.json();
        const { name, role: newRole, phone, isActive, password } = updateBody;

        // Check if user exists and belongs to same organization
        const existingUser = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!existingUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (newRole !== undefined) updateData.role = newRole;
        if (phone !== undefined) updateData.phone = phone;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            updatedAt: true,
          },
        });

        return NextResponse.json({
          message: 'User updated successfully',
          user: updatedUser,
        });

      case 'DELETE':
        // Soft delete user (set isActive to false)
        const userToDelete = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!userToDelete) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Prevent deleting own account
        if (id === user.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id },
          data: { isActive: false },
        });

        return NextResponse.json({
          message: 'User deactivated successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.USERS_READ],
});

export const PUT = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.USERS_WRITE],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.USERS_DELETE],
});
