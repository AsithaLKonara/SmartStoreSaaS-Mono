import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type ValidationResult = {
    isValid: boolean;
    error?: string;
};

export class ValidationUtils {
    /**
     * Validates if a request should be rate limited
     * @param identifier Unique identifier for the client (IP, user ID, etc.)
     * @param windowMs Time window in milliseconds
     * @param maxRequests Maximum number of requests allowed in the window
     * @param store Map to store rate limit data
     * @returns true if request is allowed, false if rate limited
     */
    public static validateRateLimit(
        identifier: string,
        windowMs: number,
        maxRequests: number,
        store: Map<string, number[]>
    ): boolean {
        const now = Date.now();
        const timestamps = store.get(identifier) || [];

        // Filter out timestamps that are outside the window
        const windowStart = now - windowMs;
        const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);

        if (validTimestamps.length >= maxRequests) {
            return false;
        }

        validTimestamps.push(now);
        store.set(identifier, validTimestamps);
        return true;
    }

    /**
     * Simple check for common SQL injection patterns
     * note: This is a basic heuristic and not a replacement for prepared statements
     */
    public static validateSQLInjection(input: string): boolean {
        if (!input) return true;

        const sqlPatterns = [
            /(\%27)|(\')/, // Single quote
            /(\-\-)/,      // Comment
            /(\%23)|(#)/,  // Comment
            /(\%3B)|(;)/,  // Terminator
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b/i
        ];

        return !sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Simple check for common XSS patterns
     */
    public static validateXSS(input: string): boolean {
        if (!input) return true;

        const xssPatterns = [
            /<script\b[^>]*>([\s\S]*?)<\/script>/i,
            /javascript:/i,
            /on\w+=/i,
            /vbscript:/i,
            /data:/i
        ];

        return !xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Validate API Key format (e.g. length check, prefix check)
     */
    public static validateAPIKey(apiKey: string): boolean {
        // Modify this regex based on your actual API key format
        // Example: starts with 'pk_' or 'sk_' and is alphanumeric
        const apiKeyRegex = /^[a-zA-Z0-9_\-]{20,100}$/;
        return apiKeyRegex.test(apiKey);
    }
}

/**
 * Higher-order function to wrap route handlers with Zod validation
 */
export function withValidation<T>(
    schema: z.ZodSchema<T>,
    handler: (data: T, req: NextRequest) => Promise<NextResponse> | NextResponse
) {
    return async (req: NextRequest) => {
        try {
            const body = await req.json();
            const validationResult = schema.safeParse(body);

            if (!validationResult.success) {
                return NextResponse.json(
                    { error: 'Validation failed', details: validationResult.error.format() },
                    { status: 400 }
                );
            }

            return handler(validationResult.data, req);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }
    };
}
