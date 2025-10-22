/**
 * Advanced Search System
 */

import { prisma } from '@/lib/prisma';

export interface SearchQuery {
  q?: string; // General search query
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search products with advanced filters
 */
export async function searchProducts(
  query: SearchQuery,
  organizationId: string
): Promise<SearchResult<any>> {
  const { q, filters = {}, sort, page = 1, limit = 20 } = query;

  const where: any = { organizationId };

  // Text search
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Apply filters
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.minPrice) {
    where.price = { ...where.price, gte: parseFloat(filters.minPrice) };
  }
  if (filters.maxPrice) {
    where.price = { ...where.price, lte: parseFloat(filters.maxPrice) };
  }
  if (filters.inStock !== undefined) {
    where.stock = filters.inStock ? { gt: 0 } : { equals: 0 };
  }
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  // Count total
  const total = await prisma.product.count({ where });

  // Fetch data
  const data = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Search orders with advanced filters
 */
export async function searchOrders(
  query: SearchQuery,
  organizationId: string
): Promise<SearchResult<any>> {
  const { q, filters = {}, sort, page = 1, limit = 20 } = query;

  const where: any = { organizationId };

  // Text search
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
  }
  if (filters.minAmount) {
    where.total = { ...where.total, gte: parseFloat(filters.minAmount) };
  }
  if (filters.maxAmount) {
    where.total = { ...where.total, lte: parseFloat(filters.maxAmount) };
  }

  const total = await prisma.order.count({ where });

  const data = await prisma.order.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Search customers with advanced filters
 */
export async function searchCustomers(
  query: SearchQuery,
  organizationId: string
): Promise<SearchResult<any>> {
  const { q, filters = {}, sort, page = 1, limit = 20 } = query;

  const where: any = { organizationId };

  // Text search
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Apply filters
  if (filters.hasOrders !== undefined) {
    if (filters.hasOrders) {
      where.orders = { some: {} };
    } else {
      where.orders = { none: {} };
    }
  }

  const total = await prisma.customer.count({ where });

  const data = await prisma.customer.findMany({
    where,
    include: {
      orders: {
        select: {
          id: true,
          total: true,
        },
      },
    },
    orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: data.map(c => ({
      ...c,
      totalOrders: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Global search across multiple entities
 */
export async function globalSearch(
  query: string,
  organizationId: string
): Promise<{
  products: any[];
  orders: any[];
  customers: any[];
}> {
  const [products, orders, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        organizationId,
        orderNumber: { contains: query, mode: 'insensitive' },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
  ]);

  return { products, orders, customers };
}

