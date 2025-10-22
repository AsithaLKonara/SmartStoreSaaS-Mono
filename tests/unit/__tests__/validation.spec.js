// Unit tests for validation logic (JavaScript version)

// Simple validation functions
function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.length < 3) {
    errors.push('Product name must be at least 3 characters');
  }
  
  if (!product.sku || !/^[A-Z0-9-]+$/.test(product.sku)) {
    errors.push('SKU must contain only uppercase letters, numbers, and hyphens');
  }
  
  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.push('Price must be positive');
  }
  
  if (product.cost && (typeof product.cost !== 'number' || product.cost <= 0)) {
    errors.push('Cost must be positive');
  }
  
  if (typeof product.stock !== 'number' || product.stock < 0 || !Number.isInteger(product.stock)) {
    errors.push('Stock must be non-negative integer');
  }
  
  if (typeof product.minStock !== 'number' || product.minStock < 0 || !Number.isInteger(product.minStock)) {
    errors.push('Minimum stock must be non-negative integer');
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

function validateCustomer(customer) {
  const errors = [];
  
  if (!customer.name || customer.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!customer.email || !emailRegex.test(customer.email)) {
    errors.push('Invalid email address');
  }
  
  if (customer.phone && !/^[\d\s\-\+\(\)]+$/.test(customer.phone)) {
    errors.push('Invalid phone number');
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

function validateOrder(order) {
  const errors = [];
  
  if (!order.customerId || order.customerId.length < 10) {
    errors.push('Invalid customer ID');
  }
  
  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('Order must have at least one item');
  }
  
  if (order.items) {
    order.items.forEach((item, index) => {
      if (!item.productId) errors.push(`Item ${index}: Missing product ID`);
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        errors.push(`Item ${index}: Quantity must be positive integer`);
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        errors.push(`Item ${index}: Price must be positive`);
      }
    });
  }
  
  if (typeof order.total !== 'number' || order.total <= 0) {
    errors.push('Total must be positive');
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

describe('Validation Functions', () => {
  describe('validateProduct', () => {
    test('validates correct product data', () => {
      const validProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 29.99,
        cost: 15.00,
        stock: 100,
        minStock: 10,
      };
      
      const result = validateProduct(validProduct);
      expect(result.valid).toBe(true);
    });

    test('rejects invalid product name', () => {
      const invalid = {
        name: 'AB', // too short
        sku: 'TEST-001',
        price: 29.99,
        stock: 100,
        minStock: 10,
      };
      
      const result = validateProduct(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least 3 characters');
    });

    test('rejects invalid SKU format', () => {
      const invalid = {
        name: 'Test Product',
        sku: 'test-001', // lowercase not allowed
        price: 29.99,
        stock: 100,
        minStock: 10,
      };
      
      const result = validateProduct(invalid);
      expect(result.valid).toBe(false);
    });

    test('rejects negative price', () => {
      const invalid = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: -10,
        stock: 100,
        minStock: 10,
      };
      
      const result = validateProduct(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCustomer', () => {
    test('validates correct customer data', () => {
      const validCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };
      
      const result = validateCustomer(validCustomer);
      expect(result.valid).toBe(true);
    });

    test('rejects invalid email', () => {
      const invalid = {
        name: 'John Doe',
        email: 'invalid-email',
      };
      
      const result = validateCustomer(invalid);
      expect(result.valid).toBe(false);
    });

    test('accepts customer without phone', () => {
      const valid = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      const result = validateCustomer(valid);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateOrder', () => {
    test('validates correct order data', () => {
      const validOrder = {
        customerId: 'clx1234567890',
        items: [
          {
            productId: 'clx9876543210',
            quantity: 2,
            price: 29.99,
          },
        ],
        total: 70.77,
      };
      
      const result = validateOrder(validOrder);
      expect(result.valid).toBe(true);
    });

    test('rejects order with no items', () => {
      const invalid = {
        customerId: 'clx1234567890',
        items: [],
        total: 0,
      };
      
      const result = validateOrder(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least one item');
    });

    test('rejects order with invalid quantity', () => {
      const invalid = {
        customerId: 'clx1234567890',
        items: [
          {
            productId: 'clx9876543210',
            quantity: 0, // must be positive
            price: 29.99,
          },
        ],
        total: 0,
      };
      
      const result = validateOrder(invalid);
      expect(result.valid).toBe(false);
    });
  });
});

