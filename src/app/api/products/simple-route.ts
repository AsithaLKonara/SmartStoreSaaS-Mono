// Simplified Products API - Working Version
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count()
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      products, // For compatibility
      pagination: { page, limit, total },
      message: 'Products fetched successfully'
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        ...body,
        id: `product-${Date.now()}`,
        organizationId: body.organizationId || 'seed-org-1-1759434570099'
      }
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

