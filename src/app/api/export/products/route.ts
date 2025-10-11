import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const organizationId = searchParams.get('organizationId');

    // Fetch products
    const products = await prisma.product.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format data for export
    const exportData = products.map(p => ({
      SKU: p.sku,
      Name: p.name,
      Description: p.description || '',
      Category: p.category?.name || '',
      Price: Number(p.price),
      Cost: Number(p.cost || 0),
      // Stock fields removed (managed via InventoryMovement/ProductVariant)
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [headers.join(',')];

      for (const row of exportData) {
        const values = headers.map(h => {
          const value = (row as any)[h];
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
    });
  } catch (error: any) {
    console.error('Export products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Export failed',
      },
      { status: 500 }
    );
  }
}

