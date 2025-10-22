/**
 * Product Recommendation Engine
 * Implements Collaborative Filtering + Content-Based Filtering (Hybrid Approach)
 * Uses item-item similarity and user-item interaction matrices
 */

export interface ProductInteraction {
  productId: string;
  productName: string;
  categoryId?: string;
  price: number;
  views?: number;
  purchases?: number;
  rating?: number;
}

export interface UserInteraction {
  productId: string;
  interactionType: 'view' | 'purchase' | 'cart' | 'wishlist';
  timestamp: Date;
  rating?: number;
}

export interface Recommendation {
  productId: string;
  productName: string;
  score: number;
  confidence: number;
  reason: string;
  method: 'collaborative' | 'content-based' | 'hybrid' | 'popular' | 'similar';
}

/**
 * Collaborative Filtering using Item-Item Similarity
 */
class CollaborativeFilter {
  /**
   * Calculate cosine similarity between two products
   */
  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find similar products based on user purchase patterns
   */
  findSimilarProducts(
    targetProductId: string,
    allInteractions: Map<string, Set<string>>, // productId -> Set of userIds who interacted
    limit: number = 5
  ): Array<{ productId: string; similarity: number }> {
    const targetUsers = allInteractions.get(targetProductId);
    if (!targetUsers || targetUsers.size === 0) return [];

    const similarities: Array<{ productId: string; similarity: number }> = [];

    // Compare with all other products
    for (const [productId, users] of allInteractions.entries()) {
      if (productId === targetProductId) continue;

      // Calculate Jaccard similarity
      const intersection = new Set([...targetUsers].filter(u => users.has(u)));
      const union = new Set([...targetUsers, ...users]);
      const similarity = intersection.size / union.size;

      if (similarity > 0) {
        similarities.push({ productId, similarity });
      }
    }

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get recommendations for a user based on their interactions
   */
  recommendForUser(
    userInteractions: string[], // productIds user has interacted with
    allInteractions: Map<string, Set<string>>,
    products: Map<string, ProductInteraction>,
    limit: number = 5
  ): Recommendation[] {
    const recommendations = new Map<string, { score: number; count: number }>();

    // For each product the user has interacted with
    for (const productId of userInteractions) {
      const similar = this.findSimilarProducts(productId, allInteractions, 10);

      // Add similar products to recommendations
      for (const { productId: similarId, similarity } of similar) {
        // Don't recommend products user has already interacted with
        if (userInteractions.includes(similarId)) continue;

        const current = recommendations.get(similarId) || { score: 0, count: 0 };
        recommendations.set(similarId, {
          score: current.score + similarity,
          count: current.count + 1
        });
      }
    }

    // Convert to array and normalize scores
    const results: Recommendation[] = [];
    for (const [productId, { score, count }] of recommendations.entries()) {
      const product = products.get(productId);
      if (!product) continue;

      const normalizedScore = score / count; // Average similarity
      results.push({
        productId,
        productName: product.productName,
        score: normalizedScore,
        confidence: Math.min(0.95, count / userInteractions.length),
        reason: 'Customers who bought your items also bought this',
        method: 'collaborative'
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/**
 * Content-Based Filtering using Product Attributes
 */
class ContentBasedFilter {
  /**
   * Calculate content similarity between products
   */
  calculateSimilarity(
    product1: ProductInteraction,
    product2: ProductInteraction
  ): number {
    let similarity = 0;
    let factors = 0;

    // Category similarity
    if (product1.categoryId && product2.categoryId) {
      similarity += product1.categoryId === product2.categoryId ? 1 : 0;
      factors++;
    }

    // Price similarity (within 30% range)
    const priceDiff = Math.abs(product1.price - product2.price);
    const priceAvg = (product1.price + product2.price) / 2;
    const priceSimScore = 1 - Math.min(1, priceDiff / (priceAvg * 0.3));
    similarity += priceSimScore;
    factors++;

    // Rating similarity
    if (product1.rating && product2.rating) {
      const ratingDiff = Math.abs(product1.rating - product2.rating);
      similarity += 1 - (ratingDiff / 5);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Recommend similar products based on content
   */
  recommendSimilar(
    targetProduct: ProductInteraction,
    allProducts: ProductInteraction[],
    limit: number = 5
  ): Recommendation[] {
    const similarities = allProducts
      .filter(p => p.productId !== targetProduct.productId)
      .map(product => ({
        product,
        similarity: this.calculateSimilarity(targetProduct, product)
      }))
      .filter(({ similarity }) => similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(({ product, similarity }) => ({
      productId: product.productId,
      productName: product.productName,
      score: similarity,
      confidence: 0.7,
      reason: 'Similar to products you viewed',
      method: 'content-based' as const
    }));
  }
}

/**
 * Hybrid Recommendation Engine
 */
export class RecommendationEngine {
  private collaborative = new CollaborativeFilter();
  private contentBased = new ContentBasedFilter();

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    userId: string,
    userInteractions: UserInteraction[],
    allProducts: ProductInteraction[],
    allUserInteractions: Map<string, UserInteraction[]>, // userId -> interactions
    limit: number = 10
  ): Promise<Recommendation[]> {
    // Build interaction matrices
    const productUserMatrix = this.buildProductUserMatrix(allUserInteractions);
    const productMap = new Map(allProducts.map(p => [p.productId, p]));
    const userProductIds = userInteractions.map(i => i.productId);

    // Get collaborative filtering recommendations
    const collaborativeRecs = this.collaborative.recommendForUser(
      userProductIds,
      productUserMatrix,
      productMap,
      Math.ceil(limit * 0.6) // 60% from collaborative
    );

    // Get content-based recommendations
    const contentRecs: Recommendation[] = [];
    if (userInteractions.length > 0) {
      // Get recommendations based on last viewed/purchased products
      const recentProducts = userInteractions
        .slice(-3)
        .map(i => productMap.get(i.productId))
        .filter(p => p !== undefined) as ProductInteraction[];

      for (const product of recentProducts) {
        const similar = this.contentBased.recommendSimilar(
          product,
          allProducts,
          3
        );
        contentRecs.push(...similar);
      }
    }

    // Merge and deduplicate recommendations
    const merged = this.mergeRecommendations(
      collaborativeRecs,
      contentRecs,
      userProductIds
    );

    // If not enough recommendations, add popular products
    if (merged.length < limit) {
      const popular = this.getPopularProducts(allProducts, userProductIds, limit - merged.length);
      merged.push(...popular);
    }

    return merged.slice(0, limit);
  }

  /**
   * Get "Frequently Bought Together" recommendations
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    allOrderItems: Map<string, string[]>, // orderId -> productIds
    allProducts: ProductInteraction[],
    limit: number = 4
  ): Promise<Recommendation[]> {
    const productMap = new Map(allProducts.map(p => [p.productId, p]));
    const coOccurrences = new Map<string, number>();

    // Find products that appear in the same orders
    for (const products of allOrderItems.values()) {
      if (!products.includes(productId)) continue;

      for (const otherProductId of products) {
        if (otherProductId === productId) continue;
        coOccurrences.set(otherProductId, (coOccurrences.get(otherProductId) || 0) + 1);
      }
    }

    // Sort by co-occurrence count
    const sorted = Array.from(coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([pid, count]) => {
      const product = productMap.get(pid);
      return {
        productId: pid,
        productName: product?.productName || 'Unknown',
        score: count / allOrderItems.size,
        confidence: 0.85,
        reason: 'Frequently bought together',
        method: 'collaborative' as const
      };
    });
  }

  /**
   * Get trending/popular products
   */
  getPopularProducts(
    allProducts: ProductInteraction[],
    excludeIds: string[] = [],
    limit: number = 10
  ): Recommendation[] {
    return allProducts
      .filter(p => !excludeIds.includes(p.productId))
      .map(product => ({
        score: (product.purchases || 0) * 0.7 + (product.views || 0) * 0.3
      }))
      .map((scoreData, index) => {
        const product = allProducts[index];
        return {
          productId: product.productId,
          productName: product.productName,
          score: scoreData.score,
          confidence: 0.6,
          reason: 'Popular in your area',
          method: 'popular' as const
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Build product-user interaction matrix
   */
  private buildProductUserMatrix(
    allUserInteractions: Map<string, UserInteraction[]>
  ): Map<string, Set<string>> {
    const matrix = new Map<string, Set<string>>();

    for (const [userId, interactions] of allUserInteractions.entries()) {
      for (const interaction of interactions) {
        if (!matrix.has(interaction.productId)) {
          matrix.set(interaction.productId, new Set());
        }
        matrix.get(interaction.productId)!.add(userId);
      }
    }

    return matrix;
  }

  /**
   * Merge and deduplicate recommendations from multiple sources
   */
  private mergeRecommendations(
    collaborative: Recommendation[],
    contentBased: Recommendation[],
    excludeIds: string[]
  ): Recommendation[] {
    const merged = new Map<string, Recommendation>();

    // Add collaborative recommendations with higher weight
    for (const rec of collaborative) {
      if (excludeIds.includes(rec.productId)) continue;
      merged.set(rec.productId, {
        ...rec,
        score: rec.score * 1.2, // Boost collaborative
        method: 'hybrid'
      });
    }

    // Add content-based recommendations
    for (const rec of contentBased) {
      if (excludeIds.includes(rec.productId)) continue;

      if (merged.has(rec.productId)) {
        // Merge scores if product already recommended
        const existing = merged.get(rec.productId)!;
        merged.set(rec.productId, {
          ...existing,
          score: (existing.score + rec.score) / 2,
          confidence: (existing.confidence + rec.confidence) / 2,
          method: 'hybrid'
        });
      } else {
        merged.set(rec.productId, rec);
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score);
  }
}

export const recommendationEngine = new RecommendationEngine();

