import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get all products with inventory data
    const products = await prisma.product.findMany({
      where: organizationId ? { organizationId } : undefined,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        price: true,
        cost: true,
        isActive: true
      }
    });

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

    // Stock movement for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...(organizationId && { organizationId }),
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        product: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
          product: m.product.name,
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

