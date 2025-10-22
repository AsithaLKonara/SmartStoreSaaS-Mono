import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$connect();
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    await prisma.$disconnect();

    logger.info({
      message: 'Database connection test successful',
      context: { userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: { connected: true, test: result }
    });
  } catch (error: any) {
    logger.error({
      message: 'Database connection test failed',
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    }, { status: 500 });
  }
}