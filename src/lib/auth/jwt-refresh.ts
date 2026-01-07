/**
 * JWT Token Auto-Refresh
 * Automatically refreshes access tokens before they expire
 */

import { JWT } from 'next-auth/jwt';
import { logger } from '../logger';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // Calculate if token is about to expire (within 5 minutes)
    const now = Date.now();
    const tokenExpires = (token.accessTokenExpires as number) || 0;
    const shouldRefresh = tokenExpires - now < 5 * 60 * 1000; // 5 minutes

    if (!shouldRefresh) {
      return token;
    }

    logger.info({
      message: 'Refreshing access token',
      context: { service: 'JWTRefresh', operation: 'refreshAccessToken' }
    });

    // Call refresh endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const refreshedTokens: RefreshTokenResponse = await response.json();

    logger.info({
      message: 'Token refreshed successfully',
      context: { service: 'JWTRefresh', operation: 'refreshAccessToken' }
    });

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
    };
  } catch (error) {
    logger.error({
      message: 'Error refreshing access token',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'JWTRefresh', operation: 'refreshAccessToken' }
    });

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * Check if token needs refresh
 */
export function shouldRefreshToken(token: JWT): boolean {
  const now = Date.now();
  const tokenExpires = (token.accessTokenExpires as number) || 0;
  
  // Refresh if token expires in less than 5 minutes
  return tokenExpires - now < 5 * 60 * 1000;
}

/**
 * Get token expiry time in human readable format
 */
export function getTokenExpiryTime(token: JWT): string {
  const tokenExpires = (token.accessTokenExpires as number) || 0;
  const now = Date.now();
  const diff = tokenExpires - now;

  if (diff < 0) {
    return 'Expired';
  }

  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m`;
}

/**
 * Check if token has error
 */
export function hasTokenError(token: JWT): boolean {
  return !!token.error;
}



