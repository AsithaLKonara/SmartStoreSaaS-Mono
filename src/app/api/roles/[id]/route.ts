import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src/lib/rbac/role-permissions.json');

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const data = JSON.parse(fileContent);
    const role = data.roles.find((r: any) => r.id === params.id);

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      role,
      allPermissions: data.permissions 
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();
    const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const data = JSON.parse(fileContent);
    const roleIndex = data.roles.findIndex((r: any) => r.id === params.id);

    if (roleIndex === -1) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    // Protection: only Super Admin can edit Platform roles
    if (data.roles[roleIndex].level === 'platform' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Only Super Admins can modify platform-level roles' }, { status: 403 });
    }

    // Update role
    data.roles[roleIndex] = {
      ...data.roles[roleIndex],
      description: updates.description ?? data.roles[roleIndex].description,
      permissions: updates.permissions ?? data.roles[roleIndex].permissions
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ message: 'Role updated successfully', role: data.roles[roleIndex] });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
