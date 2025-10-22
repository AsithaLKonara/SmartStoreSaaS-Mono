/**
 * Test API: Create Product
 * 
 * Only available in test/development environments
 * Quickly creates products for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Guard: Only allow in test environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
  throw new Error('Test endpoints are disabled in production');
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { organizationId, name, sku, price, cost, stock, minStock, ...rest } = data;
    
    if (!organizationId || !name || !sku || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price,
        cost: cost || price * 0.5,
        stock: stock || 100,
        minStock: minStock || 10,
        organizationId,
        isActive: true,
        ...rest,
      },
    });
    
    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

