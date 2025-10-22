// Unit tests for utility functions (JavaScript version)

// Price formatting utility
function formatPrice(amount, currency = 'LKR') {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency} ${formatted}`;
}

// SKU generator
function generateSKU(name, variant) {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const suffix = variant ? `-${variant.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)}` : '';
  const timestamp = Date.now().toString().slice(-4);
  return `${clean}${suffix}-${timestamp}`;
}

// Tax calculator
function calculateTax(subtotal, taxRate) {
  return Math.round(subtotal * taxRate * 100) / 100;
}

// Discount calculator
function calculateDiscount(subtotal, discountType, discountValue) {
  if (discountType === 'percentage') {
    return Math.round(subtotal * (discountValue / 100) * 100) / 100;
  }
  return Math.min(discountValue, subtotal);
}

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    test('formats number to currency with LKR symbol', () => {
      expect(formatPrice(1000)).toBe('LKR 1,000.00');
      expect(formatPrice(1234.5)).toBe('LKR 1,234.50');
    });

    test('handles zero and negative', () => {
      expect(formatPrice(0)).toBe('LKR 0.00');
      expect(formatPrice(-45.6)).toBe('LKR -45.60');
    });

    test('supports different currencies', () => {
      const usd = formatPrice(100, 'USD');
      expect(usd).toBe('USD 100.00');
    });
  });

  describe('generateSKU', () => {
    test('generates SKU from product name', () => {
      const sku = generateSKU('Premium T-Shirt');
      expect(sku).toMatch(/^PREMIU-\d{4}$/);
    });

    test('includes variant in SKU', () => {
      const sku = generateSKU('Premium T-Shirt', 'Blue Large');
      expect(sku).toMatch(/^PREMIU-BLU-\d{4}$/);
    });

    test('removes special characters', () => {
      const sku = generateSKU('Test@Product#123');
      expect(sku).toMatch(/^TESTPR-\d{4}$/);
    });
  });

  describe('calculateTax', () => {
    test('calculates tax correctly', () => {
      expect(calculateTax(100, 0.08)).toBe(8.00);
      expect(calculateTax(1000, 0.15)).toBe(150.00);
      expect(calculateTax(49.99, 0.10)).toBe(5.00);
    });

    test('rounds to 2 decimal places', () => {
      expect(calculateTax(33.33, 0.08)).toBe(2.67);
    });
  });

  describe('calculateDiscount', () => {
    test('calculates percentage discount', () => {
      expect(calculateDiscount(100, 'percentage', 10)).toBe(10.00);
      expect(calculateDiscount(1000, 'percentage', 20)).toBe(200.00);
    });

    test('calculates fixed discount', () => {
      expect(calculateDiscount(100, 'fixed', 15)).toBe(15.00);
      expect(calculateDiscount(50, 'fixed', 10)).toBe(10.00);
    });

    test('caps fixed discount at subtotal', () => {
      expect(calculateDiscount(50, 'fixed', 100)).toBe(50.00);
    });
  });
});

