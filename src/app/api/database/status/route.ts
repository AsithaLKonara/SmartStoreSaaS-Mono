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
      organizations: await prisma.organizations.count(),
      users: await prisma.users.count(),
      categories: await prisma.categories.count(),
      products: await prisma.products.count(),
      customers: await prisma.customers.count(),
      orders: await prisma.orders.count(),
      orderItems: await prisma.order_items.count(),
      payments: await prisma.payments.count(),
      analytics: await prisma.analytics.count(),
      activities: await prisma.activities.count(),
      warehouses: await prisma.warehouses.count(),
      warehouseInventory: await prisma.warehouse_inventory.count(),
      whatsappIntegrations: await prisma.whatsapp_integrations.count(),
      whatsappMessages: await prisma.whatsapp_messages.count(),
      reports: await prisma.reports.count()
    };

    // Check if we have minimum data (at least 10 rows per table)
    const hasMinimumData = Object.values(counts).every(count => count >= 10);
    
    // Get sample data for verification
    const sampleData = {
      organizations: await prisma.organizations.findMany({ take: 3 }),
      users: await prisma.users.findMany({ take: 3, select: { id: true, email: true, name: true, role: true } }),
      products: await prisma.products.findMany({ take: 3, select: { id: true, name: true, price: true, status: true } }),
      customers: await prisma.customers.findMany({ take: 3, select: { id: true, name: true, email: true, status: true } }),
      orders: await prisma.orders.findMany({ take: 3, select: { id: true, orderNumber: true, status: true, total: true } })
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
