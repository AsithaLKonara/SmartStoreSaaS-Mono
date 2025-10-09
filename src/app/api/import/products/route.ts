import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, organizationId } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Products array is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const product of products) {
      try {
        // Validate required fields
        if (!product.sku || !product.name || !product.price) {
          results.failed++;
          results.errors.push(`Missing required fields for product: ${product.name || 'Unknown'}`);
          continue;
        }

        // Upsert product
        await prisma.product.upsert({
          where: { sku: product.sku },
          update: {
            name: product.name,
            description: product.description || null,
            price: parseFloat(product.price),
            cost: product.cost ? parseFloat(product.cost) : null,
            stock: product.stock || 0,
            minStock: product.minStock || 0,
            isActive: product.active !== 'No',
          },
          create: {
            sku: product.sku,
            name: product.name,
            description: product.description || null,
            price: parseFloat(product.price),
            cost: product.cost ? parseFloat(product.cost) : null,
            stock: product.stock || 0,
            minStock: product.minStock || 0,
            isActive: product.active !== 'No',
            organizationId,
          },
        });

        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import ${product.sku}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.updated} products, ${results.failed} failed`,
    });
  } catch (error: any) {
    console.error('Import products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Import failed',
      },
      { status: 500 }
    );
  }
}

