import { NextRequest, NextResponse } from 'next/server';
import {
  calculateMarkupPrice,
  calculateMarginPrice,
  calculateBulkPrice,
  calculateDynamicPrice,
  calculateOrderTotal,
  calculateProfitMargin,
  suggestOptimalPrice,
} from '@/lib/pricing/calculator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...params } = body;

    let result: any;

    switch (type) {
      case 'markup':
        const { cost: markupCost, markupPercent } = params;
        result = {
          price: calculateMarkupPrice(markupCost, markupPercent),
        };
        break;

      case 'margin':
        const { cost: marginCost, marginPercent } = params;
        result = {
          price: calculateMarginPrice(marginCost, marginPercent),
        };
        break;

      case 'bulk':
        const { basePrice, quantity, bulkRules } = params;
        result = {
          price: calculateBulkPrice(basePrice, quantity, bulkRules),
        };
        break;

      case 'dynamic':
        const { basePrice: dynBasePrice, demandFactor, stockLevel, minStock } = params;
        result = {
          price: calculateDynamicPrice(dynBasePrice, demandFactor, stockLevel, minStock),
        };
        break;

      case 'order-total':
        const { subtotal, discount, taxRate, shipping } = params;
        result = calculateOrderTotal(subtotal, discount, taxRate, shipping);
        break;

      case 'profit-margin':
        const { sellingPrice, cost: pmCost } = params;
        result = calculateProfitMargin(sellingPrice, pmCost);
        break;

      case 'suggest-price':
        const { cost: suggestCost, targetMargin, competitorPrices } = params;
        result = suggestOptimalPrice(suggestCost, targetMargin, competitorPrices || []);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid calculation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      result,
    });
  } catch (error: any) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Calculation failed' },
      { status: 500 }
    );
  }
}

