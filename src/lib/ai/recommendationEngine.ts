import { prisma } from '@/lib/prisma';

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
  confidence: number;
}

export interface UserBehavior {
  userId: string;
  productId: string;
  action: 'VIEW' | 'CART_ADD' | 'PURCHASE' | 'RATE';
  timestamp: Date;
  value?: number; // For ratings
}

export class AIRecommendationEngine {
  private readonly MIN_INTERACTIONS = 5;
  private readonly MAX_RECOMMENDATIONS = 20;
  private readonly COLLABORATIVE_WEIGHT = 0.6;
  private readonly CONTENT_WEIGHT = 0.4;

  /**
   * Get personalized product recommendations for a user
   */
  async getRecommendations(
    userId: string,
    organizationId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const [collaborativeRecs, contentRecs] = await Promise.all([
        this.getCollaborativeRecommendations(userId, organizationId, limit),
        this.getContentBasedRecommendations(userId, organizationId, limit)
      ]);

      // Combine and rank recommendations
      const combinedRecs = this.combineRecommendations(
        collaborativeRecs,
        contentRecs,
        limit
      );

      return combinedRecs;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(organizationId, limit);
    }
  }

  /**
   * Collaborative filtering based on user behavior similarity
   */
  private async getCollaborativeRecommendations(
    userId: string,
    organizationId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      // Get user's purchase history
      const userPurchases = await prisma.order.findMany({
        where: {
          customer: { userId },
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      });

      if (userPurchases.length < this.MIN_INTERACTIONS) {
        return [];
      }

      // Find similar users based on purchase patterns
      const similarUsers = await this.findSimilarUsers(
        userId,
        organizationId,
        userPurchases
      );

      // Get products that similar users bought but current user didn't
      const recommendations = await this.getProductsFromSimilarUsers(
        userId,
        similarUsers,
        organizationId
      );

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Content-based filtering based on product attributes
   */
  private async getContentBasedRecommendations(
    userId: string,
    organizationId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      // Get user's preferred categories and tags
      const userPreferences = await this.getUserPreferences(userId, organizationId);
      
      if (!userPreferences.categories.length && !userPreferences.tags.length) {
        return [];
      }

      // Find products similar to user's preferences
      const recommendations = await prisma.product.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          OR: [
            { categoryId: { in: userPreferences.categories } },
            { tags: { hasSome: userPreferences.tags } }
          ],
          NOT: {
            orderItems: {
              some: {
                order: {
                  customer: { userId }
                }
              }
            }
          }
        },
        include: {
          category: true,
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: [
          { _count: { orderItems: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit * 2 // Get more to filter by relevance
      });

      // Score products based on relevance
      const scoredRecs = recommendations.map(product => {
        const categoryScore = userPreferences.categories.includes(product.categoryId || '') ? 0.8 : 0;
        const tagScore = product.tags.filter(tag => userPreferences.tags.includes(tag)).length * 0.2;
        const popularityScore = Math.min(product._count.orderItems / 100, 0.3);
        
        const totalScore = categoryScore + tagScore + popularityScore;
        
        return {
          productId: product.id,
          score: totalScore,
          reason: 'Similar to your preferences',
          confidence: Math.min(totalScore, 1.0)
        };
      });

      return scoredRecs
        .filter(rec => rec.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  /**
   * Find users with similar purchase patterns
   */
  private async findSimilarUsers(
    userId: string,
    organizationId: string,
    userPurchases: any[]
  ): Promise<string[]> {
    try {
      const userProductIds = userPurchases.flatMap(order => 
        order.orderItems.map(item => item.productId)
      );

      // Find users who bought similar products
      const similarUsers = await prisma.order.groupBy({
        by: ['customerId'],
        where: {
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
          customerId: { not: userId },
          orderItems: {
            some: {
              productId: { in: userProductIds }
            }
          }
        },
        _count: { id: true },
        having: {
          id: { _count: { gte: 2 } } // At least 2 similar purchases
        },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      return similarUsers.map(user => user.customerId);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get products from similar users
   */
  private async getProductsFromSimilarUsers(
    userId: string,
    similarUserIds: string[],
    organizationId: string
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations = await prisma.order.groupBy({
        by: ['productId'],
        where: {
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
          customerId: { in: similarUserIds },
          NOT: {
            orderItems: {
              some: {
                order: {
                  customer: { userId }
                }
              }
            }
          }
        },
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20
      });

      return recommendations.map(rec => ({
        productId: rec.productId,
        score: rec._count.id / 10, // Normalize score
        reason: 'Popular among similar users',
        confidence: Math.min(rec._count.id / 20, 1.0)
      }));
    } catch (error) {
      console.error('Error getting products from similar users:', error);
      return [];
    }
  }

  /**
   * Get user preferences based on purchase history
   */
  private async getUserPreferences(
    userId: string,
    organizationId: string
  ): Promise<{ categories: string[]; tags: string[] }> {
    try {
      const userOrders = await prisma.order.findMany({
        where: {
          customer: { userId },
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      });

      const categories = new Set<string>();
      const tags = new Set<string>();

      userOrders.forEach(order => {
        order.orderItems.forEach(item => {
          if (item.product.categoryId) {
            categories.add(item.product.categoryId);
          }
          item.product.tags.forEach(tag => tags.add(tag));
        });
      });

      return {
        categories: Array.from(categories),
        tags: Array.from(tags)
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { categories: [], tags: [] };
    }
  }

  /**
   * Combine different recommendation approaches
   */
  private combineRecommendations(
    collaborative: ProductRecommendation[],
    content: ProductRecommendation[],
    limit: number
  ): ProductRecommendation[] {
    const combined = new Map<string, ProductRecommendation>();

    // Add collaborative recommendations
    collaborative.forEach(rec => {
      combined.set(rec.productId, {
        ...rec,
        score: rec.score * this.COLLABORATIVE_WEIGHT
      });
    });

    // Add content-based recommendations
    content.forEach(rec => {
      const existing = combined.get(rec.productId);
      if (existing) {
        existing.score += rec.score * this.CONTENT_WEIGHT;
        existing.confidence = Math.min(existing.confidence + rec.confidence * 0.2, 1.0);
      } else {
        combined.set(rec.productId, {
          ...rec,
          score: rec.score * this.CONTENT_WEIGHT
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Fallback recommendations when AI fails
   */
  private async getFallbackRecommendations(
    organizationId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      const popularProducts = await prisma.product.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: { _count: { orderItems: 'desc' } },
        take: limit
      });

      return popularProducts.map(product => ({
        productId: product.id,
        score: 0.5,
        reason: 'Popular products',
        confidence: 0.3
      }));
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }

  /**
   * Update user behavior for learning
   */
  async recordUserBehavior(behavior: UserBehavior): Promise<void> {
    try {
      // Store behavior for future recommendations
      await prisma.analytics.create({
        data: {
          type: behavior.action,
          value: behavior.value || 1,
          organizationId: '', // Will be set from context
          customerId: '', // Will be set from context
          productId: behavior.productId,
          timestamp: behavior.timestamp,
          metadata: {
            userId: behavior.userId,
            action: behavior.action,
            value: behavior.value
          }
        }
      });
    } catch (error) {
      console.error('Error recording user behavior:', error);
    }
  }
}
