import { logger } from './logger';

// Currency utilities for Sri Lankan Rupee (LKR)
export const CURRENCY_CONFIG = {
  LKR: {
    symbol: 'රු',
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    locale: 'en-LK',
    decimalPlaces: 2,
    symbolPosition: 'before' as const,
  },
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    symbolPosition: 'before' as const,
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    locale: 'en-EU',
    decimalPlaces: 2,
    symbolPosition: 'before' as const,
  }
};

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

// Format currency with LKR as default
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'LKR',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const config = CURRENCY_CONFIG[currency];
  const { showSymbol = true, showCode = false, compact = false } = options;

  // Handle compact notation for large numbers
  if (compact && amount >= 100000) {
    const compactAmount = amount / 100000;
    const formatted = compactAmount.toFixed(1);
    const symbol = showSymbol ? config.symbol : '';
    const code = showCode ? ` ${config.code}` : '';
    return `${symbol}${formatted}L${code}`;
  }

  // Standard formatting
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount);

  const symbol = showSymbol ? config.symbol : '';
  const code = showCode ? ` ${config.code}` : '';

  return config.symbolPosition === 'before'
    ? `${symbol}${formatted}${code}`
    : `${formatted}${symbol}${code}`;
}

// Format currency for display in tables/cards
export function formatCurrencyDisplay(amount: number, currency: CurrencyCode = 'LKR'): string {
  return formatCurrency(amount, currency, { showSymbol: true, showCode: false });
}

// Format currency for forms/inputs
export function formatCurrencyInput(amount: number, currency: CurrencyCode = 'LKR'): string {
  return formatCurrency(amount, currency, { showSymbol: false, showCode: false });
}

// Parse currency string to number
export function parseCurrency(value: string, currency: CurrencyCode = 'LKR'): number {
  const config = CURRENCY_CONFIG[currency];

  // Remove currency symbols and codes
  let cleanValue = value
    .replace(config.symbol, '')
    .replace(config.code, '')
    .replace(/[,\s]/g, '')
    .trim();

  // Handle compact notation (L suffix)
  if (cleanValue.endsWith('L')) {
    cleanValue = cleanValue.replace('L', '');
    return parseFloat(cleanValue) * 100000;
  }

  return parseFloat(cleanValue) || 0;
}

// Get currency symbol
export function getCurrencySymbol(currency: CurrencyCode = 'LKR'): string {
  return CURRENCY_CONFIG[currency].symbol;
}

// Get currency name
export function getCurrencyName(currency: CurrencyCode = 'LKR'): string {
  return CURRENCY_CONFIG[currency].name;
}

// Check if amount is in LKR
export function isLKR(currency: CurrencyCode): boolean {
  return currency === 'LKR';
}

// Cache for exchange rates
let cachedRates: Record<string, number> | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Fetch latest exchange rates from open API or fallback to hardcoded
 */
export async function fetchExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<Record<string, number>> {
  // Return cached if valid
  if (cachedRates && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return cachedRates;
  }

  try {
    // Attempt to fetch from free API (e.g., open.er-api.com)
    // Note: In production, use an API key from a provider like fixer.io or exchangeratesapi.io
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        cachedRates = data.rates;
        lastFetchTime = Date.now();
        logger.info({ message: 'Fetched fresh exchange rates', context: { base: baseCurrency } });
        return cachedRates as Record<string, number>;
      }
    }

    throw new Error('Invalid API response');
  } catch (error) {
    logger.warn({
      message: 'Failed to fetch exchange rates, using fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      context: { service: 'Currency' }
    });

    // Fallback hardcoded rates (Base: USD for simplicity in this fallback, need to adjust if base is different)
    // Here we assume the request was for USD base, or we provide a set that convertCurrency handles (pairs)
    // For simplicity, we return a map of USD to others
    return {
      'LKR': 300,
      'EUR': 0.91,
      'USD': 1
    };
  }
}

// Convert between currencies
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return amount;

  // Ensure items are fetched
  const rates = await fetchExchangeRates('USD'); // Use USD as common base for conversion if needed

  // Conversion logic: Convert FROM -> USD -> TO
  // If base is USD, rates[FROM] is how many FROM per 1 USD? No, usually rates are "1 Base = X Quote"
  // API returns: "USD": 1, "LKR": 300 (means 1 USD = 300 LKR)

  // To convert FROM to TO:
  // Amount in USD = Amount / Rate(FROM)  (if Rate is item/USD)
  // Amount in TO = Amount in USD * Rate(TO)

  const rateFrom = rates[from] || (from === 'USD' ? 1 : 0);
  const rateTo = rates[to] || (to === 'USD' ? 1 : 0);

  if (!rateFrom || !rateTo) {
    logger.warn({
      message: 'Exchange rate pair not found in live data',
      context: { service: 'Currency', from, to }
    });
    // Fallback to hardcoded distinct pairs if live fetch fails completely or missing
    const hardcodedRates: Record<string, number> = {
      'LKR_USD': 0.0033,
      'LKR_EUR': 0.0030,
      'USD_LKR': 300,
      'EUR_LKR': 330,
      'USD_EUR': 0.91,
      'EUR_USD': 1.10,
    };
    return amount * (hardcodedRates[`${from}_${to}`] || 1);
  }

  // Calculate cross rate
  const amountInBase = amount / rateFrom;
  const amountInTarget = amountInBase * rateTo;

  return Number(amountInTarget.toFixed(2));
}

// Format currency with conversion
// Format currency with conversion
export async function formatCurrencyWithConversion(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  showBoth: boolean = false
): Promise<string> {
  const convertedAmount = await convertCurrency(amount, from, to);
  const formatted = formatCurrency(convertedAmount, to);

  if (showBoth && from !== to) {
    const original = formatCurrency(amount, from);
    return `${formatted} (${original})`;
  }

  return formatted;
}

// Currency input validation
export function validateCurrencyInput(value: string, currency: CurrencyCode = 'LKR'): {
  isValid: boolean;
  error?: string;
  parsedValue?: number;
} {
  const parsed = parseCurrency(value, currency);

  if (isNaN(parsed)) {
    return {
      isValid: false,
      error: 'Invalid currency format'
    };
  }

  if (parsed < 0) {
    return {
      isValid: false,
      error: 'Amount cannot be negative'
    };
  }

  if (parsed > 999999999) {
    return {
      isValid: false,
      error: 'Amount too large'
    };
  }

  return {
    isValid: true,
    parsedValue: parsed
  };
}

// Default currency for Sri Lankan businesses
export const DEFAULT_CURRENCY: CurrencyCode = 'LKR';

// Common currency amounts in LKR
export const COMMON_AMOUNTS = {
  LKR: [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000],
  USD: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  EUR: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
};

// Get common amounts for a currency
export function getCommonAmounts(currency: CurrencyCode = 'LKR'): number[] {
  return COMMON_AMOUNTS[currency] || COMMON_AMOUNTS.LKR;
}
