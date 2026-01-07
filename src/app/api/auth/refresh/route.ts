/**
 * Token Refresh Endpoint
 * Handles JWT token refresh requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface RefreshTokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  exp?: number;
}

/**
 * POST /api/auth/refresh
 * Refresh an expired access token
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || uuidv4();
  
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the refresh token
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, secret) as RefreshTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token (expires in 1 hour)
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId,
      },
      secret,
      { expiresIn: '1h' }
    );

    // Generate new refresh token (expires in 7 days)
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId,
      },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error: any) {
    logger.error({
      message: 'Token refresh error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error.message || 'Unknown error'
      },
      correlation: correlationId
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh token',
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh
 * Check if refresh endpoint is available
 */
export async function GET() {
  return NextResponse.json({
    message: 'Token refresh endpoint',
    status: 'operational',
  });
}



