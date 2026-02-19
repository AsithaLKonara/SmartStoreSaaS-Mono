/**
 * Test API: Reset Database
 * 
 * Only available in test/development environments
 * Clears test data for clean test runs
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Guard: Only allow in test environment
// Environment check moved inside handler

export async function POST(request: NextRequest) {
  // Guard: Only allow in test environment
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    );
  }
  const correlationId = request.headers.get('x-request-id') || uuidv4();

  try {
    // Delete in correct order to respect foreign key constraints

    // Delete order-related data
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.delivery.deleteMany({});
    await prisma.order.deleteMany({});

    // Delete product-related data
    await prisma.inventoryMovement.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    // Delete customer-related data
    await prisma.loyaltyTransaction.deleteMany({});
    await prisma.customerLoyalty.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.customer.deleteMany({});

    // Delete warehouse data
    await prisma.warehouseInventory.deleteMany({});
    await prisma.warehouse.deleteMany({});

    // Delete procurement data
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.supplier.deleteMany({});

    // Delete return data
    await prisma.returnItem.deleteMany({});
    await prisma.return.deleteMany({});

    // Delete gift card data
    await prisma.giftCardTransaction.deleteMany({});
    await prisma.giftCard.deleteMany({});

    // Delete affiliate data
    await prisma.affiliateCommission.deleteMany({});
    await prisma.affiliate.deleteMany({});
    await prisma.referral.deleteMany({});

    // Delete integration data
    await prisma.whatsAppMessage.deleteMany({});
    await prisma.whatsAppIntegration.deleteMany({});
    await prisma.wooCommerceIntegration.deleteMany({});

    // Delete other data
    await prisma.courier.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.analytics.deleteMany({});

    // Delete users (except super admins in production)
    if (process.env.NODE_ENV === 'test') {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: '+test@',
          },
        },
      });
    }

    // Delete test organizations
    if (process.env.NODE_ENV === 'test') {
      await prisma.subscription.deleteMany({
        where: {
          organization: {
            domain: 'test',
          },
        },
      });

      await prisma.organization.deleteMany({
        where: {
          domain: 'test',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully',
    });
  } catch (error: any) {
    logger.error({
      message: 'Reset error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error.message
      },
      correlation: correlationId
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}

