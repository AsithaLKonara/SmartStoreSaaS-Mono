import { NextResponse } from 'next/server';

/**
 * Apply security headers to the response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://challenges.cloudflare.com; object-src 'none';"
    );
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    return response;
}

/**
 * Create a secure response with appropriate headers
 */
export function secureResponse(
    body: any,
    status: number = 200,
    headers: Record<string, string> = {}
): NextResponse {
    const response = NextResponse.json(body, { status, headers });
    return applySecurityHeaders(response);
}
