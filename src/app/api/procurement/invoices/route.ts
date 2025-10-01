import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List supplier invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const invoices = await db.supplierInvoice.findMany({
      where,
      include: {
        supplier: true,
        purchaseOrder: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    apiLogger.error('Error fetching invoices', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST - Create supplier invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplierId,
      purchaseOrderId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotal,
      taxAmount,
      notes,
    } = body;

    const totalAmount = parseFloat(subtotal) + parseFloat(taxAmount || 0);

    const invoice = await db.supplierInvoice.create({
      data: {
        organizationId: session.user.organizationId,
        supplierId,
        purchaseOrderId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal: parseFloat(subtotal),
        taxAmount: parseFloat(taxAmount || 0),
        totalAmount,
        notes,
      },
      include: {
        supplier: true,
        purchaseOrder: true,
      },
    });

    apiLogger.info('Supplier invoice created', { invoiceId: invoice.id, invoiceNumber });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    apiLogger.error('Error creating invoice', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create invoice' }, { status: 500 });
  }
}

