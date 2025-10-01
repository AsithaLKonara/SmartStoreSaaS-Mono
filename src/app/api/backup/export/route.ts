export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Export all data for the organization
    const exportData = {
      metadata: {
        version: '1.2.0',
        exportDate: new Date().toISOString(),
        organizationId,
        exportedBy: session.user.email
      },
      data: {
        // Users
        users: await db.users.findMany({
          where: { organizationId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }),

        // Organizations
        organizations: await db.organizations.findMany({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }),

        // Products
        products: await db.product.findMany({
          where: { organizationId },
          include: {
            category: true,
            variants: true,
            images: true
          }
        }),

        // Customers
        customers: await db.customer.findMany({
          where: { organizationId }
        }),

        // Orders
        orders: await db.order.findMany({
          where: { organizationId },
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            },
            shippingAddress: true,
            billingAddress: true
          }
        }),

        // Categories
        categories: await db.category.findMany({
          where: { organizationId }
        }),

        // Accounting data (if exists)
        chartOfAccounts: await db.chartOfAccount.findMany({
          where: { organizationId }
        }).catch(() => []),

        journalEntries: await db.journalEntry.findMany({
          where: { organizationId }
        }).catch(() => []),

        // Procurement data (if exists)
        suppliers: await db.supplier.findMany({
          where: { organizationId }
        }).catch(() => []),

        purchaseOrders: await db.purchaseOrder.findMany({
          where: { organizationId },
          include: {
            supplier: true,
            items: true
          }
        }).catch(() => [])
      }
    };

    // Create filename
    const filename = `smartstore-backup-${organizationId}-${timestamp}.json`;

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Backup export error:', error);
    return NextResponse.json(
      { error: 'Failed to export backup' },
      { status: 500 }
    );
  }
}
