import { AuthenticatedRequest, withProtection } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { AdvancedSearchService } from '@/lib/search/advancedSearchService';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { 
  CommonErrors,
  generateRequestId,
  getRequestPath
} from '@/lib/error-handling';

const searchService = new AdvancedSearchService();

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

export async function GET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'global';
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: Record<string, any> = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (minPrice || maxPrice) {
      filters.priceRange = {
        min: minPrice ? parseFloat(minPrice) : 0,
        max: maxPrice ? parseFloat(maxPrice) : 999999
      };
    }
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.dateRange = {
        start: startDate ? new Date(startDate) : new Date(0),
        end: endDate ? new Date(endDate) : new Date()
      };
    }

    const searchOptions = {
      query,
      filters,
      sortBy,
      sortOrder,
      limit,
      offset
    };

    let results;
    switch (action) {
      case 'products':
        results = await searchService.searchProducts(request.user!.organizationId, searchOptions);
        break;

      case 'customers':
        results = await searchService.searchCustomers(request.user!.organizationId, searchOptions);
        break;

      case 'orders':
        results = await searchService.searchOrders(request.user!.organizationId, searchOptions);
        break;

      case 'global':
        results = await searchService.globalSearch(request.user!.organizationId, searchOptions);
        break;

      case 'suggestions':
        const suggestions = await searchService.getSearchSuggestions(request.user!.organizationId, query);
        results = { suggestions };
        break;

      case 'popular':
        const popularSearches = await searchService.getPopularSearches(request.user!.organizationId);
        results = { searches: popularSearches };
        break;

      default:
        // Default to global search
        results = await searchService.globalSearch(request.user!.organizationId, searchOptions);
    }

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(results, 200, origin);

  } catch (error) {
    console.error('Search API Error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

export async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let results;
    switch (action) {
      case 'search':
        const searchOptions = {
          query: data.query || '',
          filters: data.filters || {},
          sortBy: data.sortBy || 'relevance',
          sortOrder: data.sortOrder || 'desc',
          limit: data.limit || 20,
          offset: data.offset || 0
        };

        switch (data.type) {
          case 'products':
            results = await searchService.searchProducts(request.user!.organizationId, searchOptions);
            break;
          case 'customers':
            results = await searchService.searchCustomers(request.user!.organizationId, searchOptions);
            break;
          case 'orders':
            results = await searchService.searchOrders(request.user!.organizationId, searchOptions);
            break;
          default:
            results = await searchService.globalSearch(request.user!.organizationId, searchOptions);
        }
        break;

      case 'suggestions':
        const suggestions = await searchService.getSearchSuggestions(request.user!.organizationId, data.query);
        results = { suggestions };
        break;

      case 'save-search':
        // Save search query to user's search history
        await prisma.searchHistory.create({
          data: {
            userId: request.user!.userId,
            query: data.query,
            searchType: data.type || 'global',
            filters: data.filters || {},
            resultsCount: data.resultCount || 0
          }
        });
        results = { success: true };
        break;

      case 'get-search-history':
        const searchHistory = await prisma.searchHistory.findMany({
          where: { userId: request.user!.userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        results = { history: searchHistory };
        break;

      case 'clear-search-history':
        await prisma.searchHistory.deleteMany({
          where: { userId: request.user!.userId }
        });
        results = { success: true };
        break;

      default:
        const path = getRequestPath(request);
        const requestId = generateRequestId();
        return CommonErrors.BAD_REQUEST('Invalid action', path, requestId);
    }

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(results, 200, origin);

  } catch (error) {
    console.error('Search API Error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// Export protected handlers with security middleware
export const GET_PROTECTED = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  GET
);

export const POST_PROTECTED = withProtection(['ADMIN', 'MANAGER', 'STAFF'], 100)(
  POST
); 