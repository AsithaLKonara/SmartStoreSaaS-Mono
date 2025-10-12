import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database status...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check table counts
    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      payments: await prisma.payment.count(),
      analytics: await prisma.analytics.count(),
      activities: await prisma.activities.count(),
      warehouses: await prisma.warehouse.count(),
      warehouseInventory: await prisma.warehouseInventory.count(),
      whatsappMessages: await prisma.whatsapp_messages.count(),
      reports: await prisma.report.count()
    };

    // Check if we have minimum data (at least 10 rows per table)
    const hasMinimumData = Object.values(counts).every(count => count >= 10);
    
    // Get sample data for verification
    const sampleData = {
      organizations: await prisma.organization.findMany({ take: 3 }),
      users: await prisma.user.findMany({ take: 3, select: { id: true, email: true, name: true, role: true } }),
      products: await prisma.product.findMany({ take: 3, select: { id: true, name: true, price: true, isActive: true } }),
      customers: await prisma.customer.findMany({ take: 3, select: { id: true, name: true, email: true, phone: true } }),
      orders: await prisma.order.findMany({ take: 3, select: { id: true, orderNumber: true, status: true, total: true } })
    };

    console.log('📊 Database status check completed');

    return NextResponse.json({
      success: true,
      status: 'connected',
      hasMinimumData,
      counts,
      sampleData,
      message: hasMinimumData 
        ? 'Database is properly seeded with comprehensive data' 
        : 'Database needs more data - consider running seed script'
    });

  } catch (error) {
    console.error('❌ Database status check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'error',
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
