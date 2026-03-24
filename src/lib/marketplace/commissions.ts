import { prisma } from '@/lib/prisma';

/**
 * Resolves the marketplace commission rate for a specific product.
 * Priority: 1. Product Override -> 2. Category Rate -> 3. Organization Default -> 4. Platform Default (5%)
 */
export async function getMarketplaceCommission(productId: string, organizationId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      marketplaceCommissionOverride: true,
      categoryId: true,
      organization: {
        select: {
          platformCommissionRate: true
        }
      },
      category: {
        select: {
          marketplaceCommissionRate: true
        }
      }
    }
  });

  if (!product) return 0.05;

  // 1. Product Level
  if (product.marketplaceCommissionOverride !== null && product.marketplaceCommissionOverride !== undefined) {
    return product.marketplaceCommissionOverride;
  }

  // 2. Category Level
  if (product.category?.marketplaceCommissionRate !== null && product.category?.marketplaceCommissionRate !== undefined) {
    return product.category.marketplaceCommissionRate;
  }

  // 3. Organization Level
  if (product.organization?.platformCommissionRate !== null && product.organization?.platformCommissionRate !== undefined) {
    return product.organization.platformCommissionRate;
  }

  // 4. Platform Default
  return 0.05;
}
