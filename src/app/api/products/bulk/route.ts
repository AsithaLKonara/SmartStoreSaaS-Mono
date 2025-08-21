import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// GET - Export products to CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const format = searchParams.get('format') || 'csv';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get products with variants and media
    const products = await prisma.product.findMany({
      where: {
        organizationId,
        isVariant: false,
      },
      include: {
        category: true,
        variants: true,
        media: true,
        _count: {
          select: {
            variants: true,
            media: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = products.map(product => ({
        ID: product.id,
        Name: product.name,
        Description: product.description || '',
        SKU: product.sku || '',
        Price: product.price,
        'Compare Price': product.comparePrice || '',
        Cost: product.cost || '',
        'Category ID': product.categoryId || '',
        Status: product.status,
        'Inventory Quantity': product.inventoryQuantity,
        Weight: product.weight || '',
        Dimensions: product.dimensions ? JSON.stringify(product.dimensions) : '',
        Tags: product.tags.join(', '),
        'Variant Count': product._count.variants,
        'Media Count': product._count.media,
        'Order Count': product._count.orderItems,
        'Created At': product.createdAt.toISOString(),
        'Updated At': product.updatedAt.toISOString(),
      }));

      const csv = stringify(csvData, { header: true });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${organizationId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Product export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Import products from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const updateExisting = formData.get('updateExisting') === 'true';

    if (!file || !organizationId) {
      return NextResponse.json({
        error: 'File and organization ID are required',
      }, { status: 400 });
    }

    // Read and parse CSV file
    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[],
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const productData = {
          name: record.Name,
          description: record.Description || null,
          sku: record.SKU || null,
          price: parseFloat(record.Price),
          comparePrice: record['Compare Price'] ? parseFloat(record['Compare Price']) : null,
          cost: record.Cost ? parseFloat(record.Cost) : null,
          organizationId,
          categoryId: record['Category ID'] || null,
          status: record.Status || 'DRAFT',
          inventoryQuantity: parseInt(record['Inventory Quantity']) || 0,
          weight: record.Weight ? parseFloat(record.Weight) : null,
          dimensions: record.Dimensions ? JSON.parse(record.Dimensions) : null,
          tags: record.Tags ? record.Tags.split(',').map((tag: string) => tag.trim()) : [],
          createdById: session.user.id,
          updatedById: session.user.id,
        };

        if (updateExisting && record.SKU) {
          // Try to update existing product
          const existing = await prisma.product.findFirst({
            where: {
              sku: record.SKU,
              organizationId,
            },
          });

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: productData,
            });
            results.updated++;
          } else {
            await prisma.product.create({ data: productData });
            results.created++;
          }
        } else {
          // Create new product
          await prisma.product.create({ data: productData });
          results.created++;
        }
      } catch (error) {
        results.errors++;
        results.errorDetails.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk import completed',
      results,
    });
  } catch (error) {
    console.error('Product bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
