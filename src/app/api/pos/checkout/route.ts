import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { InventoryLedgerService } from '@/lib/services/inventory-ledger.service';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { terminalId, paymentMethod, items, customerId, total, subtotal, discount, tax } = body;

    const organizationId = session.user.organizationId as string;
    const userId = session.user.id;

    if (!terminalId || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Wrap checkout in a database transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create POS Transaction record
      const transaction = await tx.posTransaction.create({
        data: {
          organizationId,
          terminalId,
          cashierId: userId,
          paymentMethod,
          total,
          status: 'COMPLETED',
          transactionItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
            }))
          }
        }
      });

      // 2. Create Order for ERP integration
      const order = await tx.order.create({
        data: {
          orderNumber: `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customerId: customerId || 'guest', // handle guest or actual customer
          organizationId,
          status: 'COMPLETED',
          total,
          subtotal,
          tax,
          discount,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            }))
          }
        }
      });

      // Update POS Transaction with Order ID
      await tx.posTransaction.update({
        where: { id: transaction.id },
        data: { orderId: order.id }
      });

      // 3. Update Inventory & Analytics
      for (const item of items) {
        await InventoryLedgerService.adjustStock(tx, {
          organizationId,
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          reason: `POS Sale Order ${order.orderNumber}`,
          referenceId: order.id,
          referenceType: 'ORDER'
        });
      }

      // Update Analytics
      await tx.analytics.create({
        data: {
          organizationId,
          type: 'POS_SALE',
          value: Math.floor(total),
          metadata: {
            terminalId,
            orderId: order.id,
            paymentMethod
          }
        }
      });

      return { transaction, order };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('POS Checkout failed', { error });
    return NextResponse.json(
      { error: 'Internal server error while processing POS checkout' },
      { status: 500 }
    );
  }
}
