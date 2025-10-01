export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database structure...');

    // Try to get table info
    const result = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
      ORDER BY ordinal_position;
    `;

    // Try to count existing records
    const userCount = await prisma.users.count();
    const orgCount = await prisma.organizations.count();

    return NextResponse.json({
      success: true,
      data: {
        databaseInfo: result,
        counts: {
          users: userCount,
          organizations: orgCount,
        },
        message: 'Database structure checked successfully',
      },
    });

  } catch (error) {
    console.error('❌ Database check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
