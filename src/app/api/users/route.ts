import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get users list (paginated)
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        const where: any = {
          organizationId: user.organizationId,
          isActive: true,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (role) {
          where.role = role;
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              emailVerified: true,
              phone: true,
              createdAt: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where }),
        ]);

        return NextResponse.json({
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });

      case 'POST':
        // Create new user
        const body = await request.json();
        const { email, name, password, role: newRole, phone } = body;

        // Validate required fields
        if (!email || !name || !password || !newRole) {
          return NextResponse.json(
            { error: 'Missing required fields: email, name, password, role' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: newRole,
            organizationId: user.organizationId,
            phone: phone || null,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        });

        return NextResponse.json(
          {
            message: 'User created successfully',
            user: newUser,
          },
          { status: 201 }
        );

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Users API error:', error);
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

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.USERS_WRITE],
});
