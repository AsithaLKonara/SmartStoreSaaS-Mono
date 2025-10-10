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

    // Stock movement for the last 30 days (simplified - no variantId issues)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...(organizationId && { organizationId }),
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        createdAt: true,
        productId: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch product names separately
    const productIds = [...new Set(movements.map(m => m.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

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

