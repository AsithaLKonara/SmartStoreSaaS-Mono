/**
 * Dynamic Pricing Calculator
 */

export interface PricingRule {
  type: 'MARKUP' | 'MARGIN' | 'FIXED' | 'BULK' | 'DYNAMIC';
  value: number;
  conditions?: {
    minQuantity?: number;
    customerType?: string;
    productCategory?: string;
  };
}

/**
 * Calculate price based on cost and markup percentage
 */
export function calculateMarkupPrice(cost: number, markupPercent: number): number {
  return cost * (1 + markupPercent / 100);
}

/**
 * Calculate price based on desired margin percentage
 */
export function calculateMarginPrice(cost: number, marginPercent: number): number {
  return cost / (1 - marginPercent / 100);
}

/**
 * Calculate bulk pricing discount
 */
export function calculateBulkPrice(
  basePrice: number,
  quantity: number,
  bulkRules: Array<{ minQuantity: number; discountPercent: number }>
): number {
  // Find applicable discount
  const applicableRule = bulkRules
    .filter(rule => quantity >= rule.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  if (!applicableRule) {
    return basePrice;
  }

  return basePrice * (1 - applicableRule.discountPercent / 100);
}

/**
 * Calculate dynamic price based on demand/supply
 */
export function calculateDynamicPrice(
  basePrice: number,
  demandFactor: number,
  stockLevel: number,
  minStock: number
): number {
  // Increase price if high demand
  let price = basePrice * demandFactor;

  // Increase price if low stock
  if (stockLevel <= minStock) {
    const scarcityMultiplier = 1 + (minStock - stockLevel) / minStock * 0.2;
    price *= scarcityMultiplier;
  }

  return price;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  price: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'PERCENTAGE') {
    return price * (discountValue / 100);
  }
  return Math.min(discountValue, price);
}

/**
 * Calculate tax
 */
export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  discount: number,
  taxRate: number,
  shipping: number
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  shipping: number;
  total: number;
} {
  const taxableAmount = subtotal - discount;
  const tax = calculateTax(taxableAmount, taxRate);
  const total = taxableAmount + tax + shipping;

  return {
    subtotal,
    discount,
    taxableAmount,
    tax,
    shipping,
    total,
  };
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(sellingPrice: number, cost: number): {
  profit: number;
  marginPercent: number;
  markupPercent: number;
} {
  const profit = sellingPrice - cost;
  const marginPercent = (profit / sellingPrice) * 100;
  const markupPercent = (profit / cost) * 100;

  return { profit, marginPercent, markupPercent };
}

/**
 * Suggest optimal price
 */
export function suggestOptimalPrice(
  cost: number,
  targetMargin: number,
  competitorPrices: number[],
  demandElasticity: number = 0.5
): {
  suggestedPrice: number;
  expectedMargin: number;
  competitive: boolean;
} {
  // Calculate margin-based price
  const marginPrice = calculateMarginPrice(cost, targetMargin);

  // Get average competitor price
  const avgCompetitorPrice =
    competitorPrices.length > 0
      ? competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length
      : marginPrice;

  // Adjust based on competition
  let suggestedPrice = (marginPrice + avgCompetitorPrice) / 2;

  // Ensure minimum margin
  const minPrice = calculateMarginPrice(cost, targetMargin * 0.7);
  suggestedPrice = Math.max(suggestedPrice, minPrice);

  const expectedMargin = ((suggestedPrice - cost) / suggestedPrice) * 100;
  const competitive = competitorPrices.some(
    p => Math.abs(p - suggestedPrice) / p < 0.1
  );

  return {
    suggestedPrice,
    expectedMargin,
    competitive,
  };
}

