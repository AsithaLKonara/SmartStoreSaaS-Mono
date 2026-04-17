import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src/lib/rbac/role-permissions.json');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json({ 
      roles: data.roles,
      permissions: data.permissions,
      scopes: data.scopes
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized. Only Super Admins can add roles.' }, { status: 403 });
    }

    const newRole = await req.json();
    const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const data = JSON.parse(fileContent);

    // Basic validation
    if (!newRole.id || data.roles.find((r: any) => r.id === newRole.id)) {
      return NextResponse.json({ message: 'Invalid or duplicate Role ID' }, { status: 400 });
    }

    data.roles.push({
      id: newRole.id,
      level: newRole.level || 'tenant',
      description: newRole.description || '',
      permissions: newRole.permissions || []
    });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ message: 'Role created successfully', role: newRole });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
