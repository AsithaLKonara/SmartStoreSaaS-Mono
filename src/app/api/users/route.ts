import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use raw query to handle role enum mismatch
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt", "updatedAt"
      FROM users
      ORDER BY "createdAt" DESC
    ` as any[];

    return NextResponse.json({
      success: true,
      users,
      data: users
    });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'TENANT_ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      user,
      data: user
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

