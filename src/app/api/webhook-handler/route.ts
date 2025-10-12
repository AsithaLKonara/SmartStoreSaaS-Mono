import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Generic webhook handler for external integrations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, event, data } = body;

    // Log webhook
    console.log(`Webhook received from ${source}:`, event);

    // Handle different sources
    switch (source) {
      case 'woocommerce':
        await handleWooCommerceWebhook(event, data);
        break;
      
      case 'shopify':
        await handleShopifyWebhook(event, data);
        break;
      
      default:
        console.log(`Unknown webhook source: ${source}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleWooCommerceWebhook(event: string, data: any) {
  switch (event) {
    case 'order.created':
    case 'order.updated':
      // Update order in database
      console.log('WooCommerce order event:', data);
      break;
    
    case 'product.updated':
      // Update product in database
      console.log('WooCommerce product event:', data);
      break;
  }
}

async function handleShopifyWebhook(event: string, data: any) {
  switch (event) {
    case 'orders/create':
    case 'orders/updated':
      // Update order in database
      console.log('Shopify order event:', data);
      break;
    
    case 'products/update':
      // Update product in database
      console.log('Shopify product event:', data);
      break;
  }
}

