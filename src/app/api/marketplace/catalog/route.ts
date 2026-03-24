import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || undefined;
    
    // In a production system at massive scale, Elasticsearch, Algolia or Meilisearch
    // should replace this Prisma query. For this MVP, we use ilike against PostgreSQL.
    
    const products = await prisma.product.findMany({
      where: {
        isMarketplacePublished: true,
        isActive: true,
        stock: { gt: 0 },
        ...(categoryId && { marketplaceCategory: categoryId }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } },
          ]
        })
      },
      include: {
        organization: {
          select: { id: true, name: true, logo: true, rating: true, status: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (error) {
    logger.error('Marketplace catalog search failed:', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve catalog' },
      { status: 500 }
    );
  }
}
