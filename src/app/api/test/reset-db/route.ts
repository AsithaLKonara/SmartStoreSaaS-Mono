import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Enforce security: Only allow in non-production/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production environment' }, { status: 403 });
  }

  const prisma = new PrismaClient();

  try {
    logger.info({ message: '🔄 [TEST API] Resetting test database...' });

    // Get all public table names in PostgreSQL
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `;

    // Truncate tables cascade
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table.tablename}" CASCADE`
        );
      } catch (error: any) {
        logger.warn({ message: `Could not truncate table ${table.tablename}`, error });
      }
    }

    logger.info({ message: '✅ [TEST API] Database reset complete' });
    return NextResponse.json({ success: true, message: 'Database reset successfully' });
  } catch (error: any) {
    logger.error({ message: '❌ [TEST API] Database reset failed', error });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
