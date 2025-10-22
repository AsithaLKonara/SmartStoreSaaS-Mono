/**
 * Multi-Currency Support
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to base currency (USD)
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', rate: 325.0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.0 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35 },
];

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency);
  const to = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency);

  if (!from || !to) {
    throw new Error('Currency not supported');
  }

  // Convert to USD first, then to target currency
  const usdAmount = amount / from.rate;
  return usdAmount * to.rate;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }

  return `${currency.symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
}

/**
 * Update exchange rates (in production, fetch from API)
 */
export async function updateExchangeRates(): Promise<void> {
  // In production, fetch from API like:
  // - https://api.exchangerate-api.com
  // - https://openexchangerates.org
  // For now, rates are static
  console.log('Exchange rates would be updated from API');
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES;
}

/**
 * Convert price with markup/discount
 */
export function convertPriceWithAdjustment(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  adjustmentPercent: number = 0
): number {
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return converted * (1 + adjustmentPercent / 100);
}

/**
 * Batch convert multiple amounts
 */
export function batchConvert(
  amounts: number[],
  fromCurrency: string,
  toCurrency: string
): number[] {
  return amounts.map(amount => convertCurrency(amount, fromCurrency, toCurrency));
}

