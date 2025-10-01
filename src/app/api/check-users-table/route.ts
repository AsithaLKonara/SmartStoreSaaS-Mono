import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking users table structure...');

    // Get users table info
    const result = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      success: true,
      data: {
        usersTableInfo: result,
        message: 'Users table structure checked successfully',
      },
    });

  } catch (error) {
    console.error('❌ Check users table error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check users table',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
