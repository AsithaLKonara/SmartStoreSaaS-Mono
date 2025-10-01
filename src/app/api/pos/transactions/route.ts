import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List POS transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const terminalId = searchParams.get('terminalId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (terminalId) where.terminalId = terminalId;
    if (status) where.status = status;

    const transactions = await db.pOSTransaction.findMany({
      where,
      include: {
        terminal: true,
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching POS transactions', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST - Create POS transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      terminalId,
      customerId,
      customerName,
      customerEmail,
      items,
      payments,
      discountAmount,
      notes,
    } = body;

    if (!terminalId || !items || items.length === 0 || !payments || payments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Terminal, items, and payments are required' },
        { status: 400 }
      );
    }

    // Generate transaction number
    const count = await db.pOSTransaction.count({
      where: { organizationId: session.user.organizationId },
    });
    const transactionNumber = `POS-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const transactionItems = items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discountAmount || 0;
      const itemTax = (itemSubtotal - itemDiscount) * (item.taxRate || 0) / 100;
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        discountAmount: itemDiscount,
        taxRate: item.taxRate || 0,
        totalPrice: itemSubtotal - itemDiscount + itemTax,
      };
    });

    const totalAmount = subtotal - (discountAmount || 0) + taxAmount;

    // Determine payment method
    const paymentMethod = payments.length === 1 ? payments[0].paymentMethod : 'split';

    const transaction = await db.pOSTransaction.create({
      data: {
        organizationId: session.user.organizationId,
        terminalId,
        transactionNumber,
        customerId,
        customerName,
        customerEmail,
        subtotal,
        taxAmount,
        discountAmount: discountAmount || 0,
        totalAmount,
        paymentMethod,
        receiptNumber: transactionNumber,
        notes,
        items: {
          create: transactionItems,
        },
        payments: {
          create: payments.map((payment: any) => ({
            paymentMethod: payment.paymentMethod,
            amount: parseFloat(payment.amount),
            cardLast4: payment.cardLast4,
            cardBrand: payment.cardBrand,
            cashTendered: payment.cashTendered ? parseFloat(payment.cashTendered) : null,
            changeGiven: payment.changeGiven ? parseFloat(payment.changeGiven) : null,
            transactionRef: payment.transactionRef,
          })),
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // Update product inventory
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    apiLogger.info('POS transaction created', { transactionId: transaction.id, transactionNumber });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    apiLogger.error('Error creating POS transaction', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create transaction' }, { status: 500 });
  }
}

