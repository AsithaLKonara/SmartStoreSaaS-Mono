import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenant } from '@/lib/auth/with-tenant';

export const GET = withTenant(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    // Scoping for organizationId is now handled AUTOMATICALLY by the Prisma Extension
    // based on the withTenant() context.
    const where: any = {
      isActive: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        category: {
          select: { name: true }
        }
      },
      take: 50,
    });

    const mappedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      category: p.category?.name || 'Uncategorized'
    }));

    return NextResponse.json({ success: true, data: mappedProducts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
});
