import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, role, roleTag, password, isActive } = body;

    // Check if user exists and belongs to the same organization
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Role-based access control for the update
    if (session.user.role !== 'SUPER_ADMIN') {
      if (existingUser.organizationId !== session.user.organizationId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }
      // Tenant admins cannot promote to super admin
      if (role === 'SUPER_ADMIN') {
        return NextResponse.json({ message: 'Forbidden action' }, { status: 403 });
      }
    }

    const updateData: any = {
      name,
      email,
      role,
      roleTag,
      isActive,
      updatedAt: new Date(),
    };

    if (password && password.trim() !== '') {
      updateData.password = await hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Isolation check
    if (session.user.role !== 'SUPER_ADMIN' && existingUser.organizationId !== session.user.organizationId) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
