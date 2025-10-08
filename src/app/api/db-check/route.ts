import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic counts
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const customerCount = await prisma.customer.count();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      counts: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        customers: customerCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
