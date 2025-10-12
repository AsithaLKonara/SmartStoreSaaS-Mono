import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function withValidation(options: ValidationOptions) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        // Validate request body
        if (options.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const body = await request.json();
          options.body.parse(body);
        }

        // Validate query parameters
        if (options.query) {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          options.query.parse(queryParams);
        }

        // Validate route parameters
        if (options.params) {
          // This would need to be passed from the route handler
          // For now, we'll skip this as it's not easily accessible in middleware
        }

        return await handler(request);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }));

          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: errors
            },
            { status: 400 }
          );
        }

        // Re-throw non-validation errors
        throw error;
      }
    };
  };
}

// Helper function for validating request body
export async function validateRequestBody<T>(
  request: NextRequest,
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
  request: NextRequest,
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
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors
    },
    { status: 400 }
  );
}




