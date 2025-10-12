import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, searchOrders, searchCustomers, globalSearch } from '@/lib/search/advanced';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'global';
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build search query
    const searchQuery = {
      q: query,
      filters: {},
      sort: searchParams.get('sortField') && searchParams.get('sortOrder') ? {
        field: searchParams.get('sortField')!,
        order: searchParams.get('sortOrder') as 'asc' | 'desc',
      } : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    // Apply filters
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter.')) {
        const filterKey = key.replace('filter.', '');
        (searchQuery.filters as any)[filterKey] = value;
      }
    });

    let results: any;

    switch (type) {
      case 'products':
        results = await searchProducts(searchQuery, organizationId);
        break;

      case 'orders':
        results = await searchOrders(searchQuery, organizationId);
        break;

      case 'customers':
        results = await searchCustomers(searchQuery, organizationId);
        break;

      case 'global':
      default:
        results = await globalSearch(query, organizationId);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      query,
      results,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
