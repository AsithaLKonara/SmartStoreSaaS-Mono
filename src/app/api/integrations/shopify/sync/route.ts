import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/integrations/shopify';
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

    const results: any = {};

    // Sync products
    if (syncType === 'all' || syncType === 'products') {
      const productData = await shopifyService.getProducts(100);
      
      let synced = 0;
      for (const shopifyProduct of productData.products) {
        const variant = shopifyProduct.variants[0];
        
        await prisma.product.upsert({
          where: { sku: variant.sku || `SHOPIFY-${shopifyProduct.id}` },
          update: {
            name: shopifyProduct.title,
            description: shopifyProduct.body_html,
            price: parseFloat(variant.price),
            stock: variant.inventory_quantity || 0,
          },
          create: {
            name: shopifyProduct.title,
            description: shopifyProduct.body_html,
            sku: variant.sku || `SHOPIFY-${shopifyProduct.id}`,
            price: parseFloat(variant.price),
            stock: variant.inventory_quantity || 0,
            organizationId,
          },
        });
        synced++;
      }

      results.products = {
        synced,
        total: productData.products.length,
        success: true,
      };
    }

    // Sync orders
    if (syncType === 'all' || syncType === 'orders') {
      const orderData = await shopifyService.getOrders(100);
      results.orders = {
        synced: orderData.orders.length,
        success: true,
        message: 'Order sync not yet implemented in database',
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Shopify sync completed',
      results,
    });
  } catch (error: any) {
    console.error('Shopify sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sync failed',
      },
      { status: 500 }
    );
  }
}

