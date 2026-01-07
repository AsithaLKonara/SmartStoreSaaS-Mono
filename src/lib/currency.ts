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

// Convert between currencies (mock rates for demo)
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;

  // Mock exchange rates (for demo purposes)
  const rates: Record<string, number> = {
    'LKR_USD': 0.0033, // 1 LKR = 0.0033 USD
    'LKR_EUR': 0.0030, // 1 LKR = 0.0030 EUR
    'USD_LKR': 300,    // 1 USD = 300 LKR
    'EUR_LKR': 330,    // 1 EUR = 330 LKR
    'USD_EUR': 0.91,   // 1 USD = 0.91 EUR
    'EUR_USD': 1.10,   // 1 EUR = 1.10 USD
  };

  const rateKey = `${from}_${to}`;
  const rate = rates[rateKey];
  
  if (!rate) {
    logger.warn({
      message: 'Exchange rate not found',
      context: { service: 'Currency', operation: 'convert', from, to }
    });
    return amount;
  }

  return amount * rate;
}

// Format currency with conversion
export function formatCurrencyWithConversion(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  showBoth: boolean = false
): string {
  const convertedAmount = convertCurrency(amount, from, to);
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
