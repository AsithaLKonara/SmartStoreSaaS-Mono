import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ProductRecommendation {
  productId: string;
  productName: string;
  reason: string;
  confidence: number;
}

export interface UserBehavior {
  productId: string;
  viewCount: number;
  purchaseCount: number;
  lastInteraction: Date;
}

export class AIRecommendationEngine {
  /**
   * Get personalized product recommendations for a user
   */
  async getRecommendations(
    customerId: string,
    organizationId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations: ProductRecommendation[] = [];

      // Get customer's order history
      const customerOrders = await prisma.order.findMany({
        where: {
          customerId,
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  price: true,
                  tags: true
                }
              }
            }
          }
        }
      });

      if (customerOrders.length === 0) {
        // New customer - recommend popular products
        return await this.getPopularProducts(organizationId, limit);
      }

      // Get customer's purchased product categories
      const purchasedCategories = new Set<string>();
      const purchasedProducts = new Set<string>();
      
      customerOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product.category) {
            purchasedCategories.add(item.product.category);
          }
          purchasedProducts.add(item.product.id);
        });
      });

      // Collaborative filtering - find similar customers
      const similarCustomers = await this.findSimilarCustomers(
        customerId,
        organizationId,
        purchasedCategories
      );

      // Content-based filtering - recommend products in purchased categories
      const contentBasedRecs = await this.getContentBasedRecommendations(
        organizationId,
        purchasedCategories,
        purchasedProducts,
        limit
      );

      // Collaborative filtering - recommend products bought by similar customers
      const collaborativeRecs = await this.getCollaborativeRecommendations(
        organizationId,
        similarCustomers,
        purchasedProducts,
        limit
      );

      // Combine and rank recommendations
      const allRecommendations = [...contentBasedRecs, ...collaborativeRecs];
      const rankedRecs = this.rankRecommendations(allRecommendations);

      return rankedRecs.slice(0, limit);
    } catch (error) {
      logger.error({
        message: 'Error getting recommendations',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getRecommendations', userId, organizationId }
      });
      return await this.getPopularProducts(organizationId, limit);
    }
  }

  /**
   * Get popular products for new customers
   */
  private async getPopularProducts(
    organizationId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      const popularProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            organizationId,
            status: { in: ['COMPLETED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        _count: { id: true },
        _sum: { quantity: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit * 2 // Get more to filter out inactive products
      });

      const productIds = popularProducts.map(p => p.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          category: true
        }
      });

      return products.slice(0, limit).map(product => ({
        productId: product.id,
        productName: product.name,
        reason: 'Popular product',
        confidence: 0.7
      }));
    } catch (error) {
      logger.error({
        message: 'Error getting popular products',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getPopularProducts', organizationId, limit }
      });
      return [];
    }
  }

  /**
   * Find customers with similar purchase patterns
   */
  private async findSimilarCustomers(
    customerId: string,
    organizationId: string,
    purchasedCategories: Set<string>
  ): Promise<string[]> {
    try {
      // Get customers who bought products in the same categories
      const similarCustomers = await prisma.orderItem.groupBy({
        by: ['orderId'],
        where: {
          order: {
            organizationId,
            customerId: { not: customerId },
            status: { in: ['COMPLETED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          },
          product: {
            category: { in: Array.from(purchasedCategories) }
          }
        },
        _count: { id: true }
      });

      // Get customer IDs from orders
      const orderIds = similarCustomers.map(item => item.orderId);
      const orders = await prisma.order.findMany({
        where: {
          id: { in: orderIds }
        },
        select: { customerId: true }
      });

      // Count occurrences and return top similar customers
      const customerCounts = new Map<string, number>();
      orders.forEach(order => {
        customerCounts.set(order.customerId, (customerCounts.get(order.customerId) || 0) + 1);
      });

      return Array.from(customerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([customerId]) => customerId);
    } catch (error) {
      logger.error({
        message: 'Error finding similar customers',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'findSimilarCustomers', userId, organizationId }
      });
      return [];
    }
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(
    organizationId: string,
    purchasedCategories: Set<string>,
    purchasedProducts: Set<string>,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          id: { notIn: Array.from(purchasedProducts) },
          category: { in: Array.from(purchasedCategories) }
        },
        select: {
          id: true,
          name: true,
          category: true
        },
        take: limit * 2
      });

      return products.slice(0, limit).map(product => ({
        productId: product.id,
        productName: product.name,
        reason: `Similar to products in ${product.category}`,
        confidence: 0.8
      }));
    } catch (error) {
      logger.error({
        message: 'Error getting content-based recommendations',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getContentBasedRecommendations', userId, organizationId }
      });
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    organizationId: string,
    similarCustomers: string[],
    purchasedProducts: Set<string>,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      if (similarCustomers.length === 0) return [];

      const recommendations = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            organizationId,
            customerId: { in: similarCustomers },
            status: { in: ['COMPLETED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            }
          },
          productId: { notIn: Array.from(purchasedProducts) }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      });

      const productIds = recommendations.map(r => r.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          category: true
        }
      });

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        reason: 'Customers like you also bought',
        confidence: 0.75
      }));
    } catch (error) {
      logger.error({
        message: 'Error getting collaborative recommendations',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getCollaborativeRecommendations', userId, organizationId }
      });
      return [];
    }
  }

  /**
   * Rank and deduplicate recommendations
   */
  private rankRecommendations(
    recommendations: ProductRecommendation[]
  ): ProductRecommendation[] {
    // Remove duplicates and rank by confidence
    const uniqueRecs = new Map<string, ProductRecommendation>();
    
    recommendations.forEach(rec => {
      const existing = uniqueRecs.get(rec.productId);
      if (!existing || rec.confidence > existing.confidence) {
        uniqueRecs.set(rec.productId, rec);
      }
    });

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(
    organizationId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const trendingProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            organizationId,
            status: { in: ['COMPLETED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        },
        _count: { id: true },
        _sum: { quantity: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      });

      const productIds = trendingProducts.map(p => p.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true
        }
      });

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        reason: 'Trending now',
        confidence: 0.9
      }));
    } catch (error) {
      logger.error({
        message: 'Error getting trending products',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getTrendingProducts', organizationId, limit }
      });
      return [];
    }
  }

  /**
   * Get frequently bought together products
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    organizationId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      // Find orders that contain the given product
      const ordersWithProduct = await prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            organizationId,
            status: { in: ['COMPLETED', 'DELIVERED'] }
          }
        },
        select: { orderId: true }
      });

      if (ordersWithProduct.length === 0) return [];

      const orderIds = ordersWithProduct.map(item => item.orderId);

      // Find other products in those orders
      const relatedProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          orderId: { in: orderIds },
          productId: { not: productId }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      });

      const productIds = relatedProducts.map(p => p.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true
        }
      });

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        reason: 'Frequently bought together',
        confidence: 0.85
      }));
    } catch (error) {
      logger.error({
        message: 'Error getting frequently bought together products',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AIRecommendationEngine', operation: 'getFrequentlyBoughtTogether', productId, organizationId }
      });
      return [];
    }
  }
}