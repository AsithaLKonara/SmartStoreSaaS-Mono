import { z } from 'zod';

// Base validation schemas
export const idSchema = z.string().min(1, 'ID is required');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const phoneSchema = z
  .string()
  .optional()
  .refine((val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val), {
    message: 'Invalid phone number format'
  });

// User validation schemas
export const userCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: phoneSchema,
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional()
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Product validation schemas
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  cost: z.number().nonnegative('Cost cannot be negative').max(999999.99, 'Cost too high').optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  weight: z.number().nonnegative().optional(),
  dimensions: z.object({
    length: z.number().nonnegative(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative()
  }).optional()
});

export const productUpdateSchema = productCreateSchema.partial();

// Customer validation schemas
export const customerCreateSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: phoneSchema,
  company: z.string().max(255).optional(),
  address: z.object({
    street: z.string().max(255),
    city: z.string().max(100),
    state: z.string().max(100),
    zipCode: z.string().max(20),
    country: z.string().max(100).default('US')
  }).optional(),
  dateOfBirth: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional()
});

export const customerUpdateSchema = customerCreateSchema.partial();

// Order validation schemas
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be positive')
});

export const orderCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  shippingAddress: z.object({
    street: z.string().max(255),
    city: z.string().max(100),
    state: z.string().max(100),
    zipCode: z.string().max(20),
    country: z.string().max(100).default('US')
  }).optional(),
  billingAddress: z.object({
    street: z.string().max(255),
    city: z.string().max(100),
    state: z.string().max(100),
    zipCode: z.string().max(20),
    country: z.string().max(100).default('US')
  }).optional(),
  notes: z.string().max(1000).optional(),
  discount: z.number().nonnegative().max(100).optional(),
  taxRate: z.number().nonnegative().max(100).optional()
});

export const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  shippingAddress: orderCreateSchema.shape.shippingAddress.optional(),
  billingAddress: orderCreateSchema.shape.billingAddress.optional(),
  notes: z.string().max(1000).optional()
});

// Organization validation schemas
export const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  phone: phoneSchema,
  address: z.object({
    street: z.string().max(255),
    city: z.string().max(100),
    state: z.string().max(100),
    zipCode: z.string().max(20),
    country: z.string().max(100).default('US')
  }).optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

// Combined schemas
export const productQuerySchema = paginationSchema.merge(searchSchema);
export const customerQuerySchema = paginationSchema.merge(searchSchema);
export const orderQuerySchema = paginationSchema.merge(searchSchema);

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }
  return result.data;
};

export const validateQuery = (schema: z.ZodSchema, searchParams: URLSearchParams) => {
  const params = Object.fromEntries(searchParams.entries());
  return validateSchema(schema, params);
};

// Helper function for validating request body
export async function validateRequestBody<T>(
  request: any, // Use any to support both Request and NextRequest
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
    throw error;
  }
}

// Helper function for validating query parameters
export function validateQueryParams<T>(
  request: any, // Use any to support both Request and NextRequest
  schema: ZodSchema<T>
): T {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    return schema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
    throw error;
  }
}

// Helper function for creating validation error response
export function createValidationErrorResponse(errors: any[]) {
  return Response.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors
    },
    { status: 400 }
  );
}
