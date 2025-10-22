/**
 * Comprehensive Validation Schemas
 * Centralized validation using Zod
 */

import { z } from 'zod';

/**
 * Product Validation Schema
 */
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters'),
  
  sku: z.string()
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must be less than 50 characters'),
  
  price: z.number()
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must be less than 1,000,000'),
  
  costPrice: z.number()
    .nonnegative('Cost price cannot be negative')
    .max(1000000, 'Cost price must be less than 1,000,000')
    .optional(),
  
  stock: z.number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative'),
  
  minStock: z.number()
    .int('Minimum stock must be a whole number')
    .nonnegative('Minimum stock cannot be negative')
    .optional(),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  
  categoryId: z.string()
    .min(1, 'Category is required'),
  
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Customer Validation Schema
 */
export const customerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  
  phone: z.string()
    .regex(/^[\+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .optional(),
  
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
  
  postalCode: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

/**
 * Order Validation Schema
 */
export const orderSchema = z.object({
  customerId: z.string()
    .min(1, 'Customer is required'),
  
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1, 'At least one item is required'),
  
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .default('PENDING'),
  
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

/**
 * User Validation Schema
 */
export const userSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
  
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'])
    .default('STAFF'),
  
  phone: z.string()
    .regex(/^[\+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .optional(),
});

export type UserInput = z.infer<typeof userSchema>;

/**
 * Login Validation Schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  
  password: z.string()
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Settings Validation Schema
 */
export const organizationSettingsSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be less than 200 characters'),
  
  email: z.string()
    .email('Invalid email address')
    .optional(),
  
  phone: z.string()
    .regex(/^[\+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .optional(),
  
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  
  taxId: z.string()
    .max(50, 'Tax ID must be less than 50 characters')
    .optional(),
  
  currency: z.string()
    .length(3, 'Currency code must be 3 characters')
    .default('USD'),
  
  timezone: z.string().default('UTC'),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;

/**
 * Helper function to validate data
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _global: 'Validation failed' }
    };
  }
}

/**
 * Helper function to validate data and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    const errorMessages = Object.values(result.errors).join(', ');
    throw new AppError(errorMessages, ErrorCodes.VALIDATION_ERROR, 400, { errors: result.errors });
  }
  return result.data;
}
