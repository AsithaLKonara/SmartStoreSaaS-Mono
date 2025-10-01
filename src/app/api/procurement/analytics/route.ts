export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Total spend
    const totalSpend = await db.supplierInvoice.aggregate({
      where: {
        organizationId: session.user.organizationId,
        paymentStatus: 'paid',
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Pending invoices
    const pendingInvoices = await db.supplierInvoice.aggregate({
      where: {
        organizationId: session.user.organizationId,
        paymentStatus: { not: 'paid' },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Active suppliers
    const activeSuppliers = await db.supplier.count({
      where: {
        organizationId: session.user.organizationId,
        status: 'active',
      },
    });

    // Open purchase orders
    const openPOs = await db.purchaseOrder.count({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ['sent', 'confirmed', 'partial'] },
      },
    });

    // Top suppliers by spend
    const topSuppliers = await db.supplierInvoice.groupBy({
      by: ['supplierId'],
      where: {
        organizationId: session.user.organizationId,
        paymentStatus: 'paid',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 5,
    });

    // Get supplier details
    const supplierIds = topSuppliers.map((s) => s.supplierId);
    const suppliers = await db.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, companyName: true, supplierCode: true },
    });

    const topSuppliersWithNames = topSuppliers.map((ts) => {
      const supplier = suppliers.find((s) => s.id === ts.supplierId);
      return {
        supplierId: ts.supplierId,
        supplierName: supplier?.companyName || 'Unknown',
        supplierCode: supplier?.supplierCode || '',
        totalSpend: ts._sum.totalAmount || 0,
        invoiceCount: ts._count,
      };
    });

    // Monthly spend trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpend = await db.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "invoiceDate") as month,
        SUM("totalAmount") as total
      FROM supplier_invoices
      WHERE "organizationId" = ${session.user.organizationId}
        AND "paymentStatus" = 'paid'
        AND "invoiceDate" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSpend: totalSpend._sum.totalAmount || 0,
          pendingAmount: pendingInvoices._sum.totalAmount || 0,
          pendingCount: pendingInvoices._count || 0,
          activeSuppliers,
          openPOs,
        },
        topSuppliers: topSuppliersWithNames,
        monthlySpend,
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching procurement analytics', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}

