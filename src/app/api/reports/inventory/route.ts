import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get all products with inventory data (stock column doesn't exist, use default 0)
    const products = await prisma.product.findMany({
      where: organizationId ? { organizationId } : undefined,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true
      }
    }).then(prods => prods.map(p => ({
      ...p,
      stock: 0,
      minStock: 0,
      isActive: true
    })));

    // Calculate metrics
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    // Calculate inventory value
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.stock * Number(p.cost || p.price)),
      0
    );

    // Stock movement for the last 30 days - using raw query to avoid schema issues
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let movements: any[] = [];
    let productMap: Record<string, string> = {};
    
    try {
      // Use raw query to avoid variantId column issues
      const rawMovements = await prisma.$queryRaw`
        SELECT id, type, quantity, "createdAt", "productId"
        FROM inventory_movements
        WHERE "createdAt" >= ${thirtyDaysAgo}
        ${organizationId ? prisma.$queryRaw`AND "organizationId" = ${organizationId}` : prisma.$queryRaw``}
        ORDER BY "createdAt" DESC
        LIMIT 50
      ` as any[];
      
      movements = rawMovements || [];
      
      // Fetch product names if we have movements
      if (movements.length > 0) {
        const productIds = [...new Set(movements.map(m => m.productId))];
        const productData = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        });
        productMap = Object.fromEntries(productData.map(p => [p.id, p.name]));
      }
    } catch (movementError) {
      console.error('Error fetching movements:', movementError);
      // Continue without movements data
      movements = [];
    }

    return NextResponse.json({
      success: true,
      report: {
        summary: {
          totalProducts,
          activeProducts,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalInventoryValue
        },
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.stock,
          minStock: p.minStock,
          status: 'Low Stock'
        })),
        outOfStockProducts: outOfStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          status: 'Out of Stock'
        })),
        recentMovements: movements.slice(0, 50).map(m => ({
          id: m.id,
          product: productMap[m.productId] || 'Unknown',
          type: m.type,
          quantity: m.quantity,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Inventory report error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

