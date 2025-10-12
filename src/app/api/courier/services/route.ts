export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbManager from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const services = await dbManager.executeWithRetry(
      async (prisma) => await prisma.courier.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      'fetch courier services'
    );

    return NextResponse.json(services);
  } catch (error) {
    apiLogger.error('Error fetching courier services', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: 'Failed to fetch courier services' },
      { status: 500 }
    );
  }
}


