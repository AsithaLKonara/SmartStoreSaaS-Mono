import { NextRequest, NextResponse } from 'next/server';
import { wooCommerceService } from '@/lib/integrations/woocommerce';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, syncType = 'all' } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const results: any = {
      products: null,
      orders: null,
    };

    // Sync products
    if (syncType === 'all' || syncType === 'products') {
      const productSync = await wooCommerceService.syncProducts(organizationId);
      
      // Save products to database
      for (const product of productSync.products) {
        await prisma.product.upsert({
          where: { sku: product.sku },
          update: {
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
          },
          create: {
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            organizationId: product.organizationId,
          },
        });
      }

      results.products = {
        synced: productSync.count,
        success: true,
      };
    }

    // Sync orders
    if (syncType === 'all' || syncType === 'orders') {
      const orderSync = await wooCommerceService.syncOrders(organizationId);
      results.orders = {
        synced: orderSync.count,
        success: true,
      };
    }

    return NextResponse.json({
      success: true,
      message: 'WooCommerce sync completed',
      results,
    });
  } catch (error: any) {
    console.error('WooCommerce sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sync failed',
      },
      { status: 500 }
    );
  }
}

