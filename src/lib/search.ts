export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const createSearchQuery = (params: Partial<SearchQuery>): SearchQuery => {
  return {
    query: params.query || '',
    filters: params.filters || {},
    sort: params.sort || 'createdAt',
    order: params.order || 'desc',
    page: params.page || 1,
    limit: params.limit || 10,
  };
};

