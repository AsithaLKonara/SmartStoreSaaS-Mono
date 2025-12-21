import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Sign a JWT access token
   */
  static signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      algorithm: 'HS256'
    });
  }

  /**
   * Sign a JWT refresh token
   */
  static signRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify and decode a JWT access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256']
      }) as JWTPayload;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify and decode a JWT refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET, {
        algorithms: ['HS256']
      }) as RefreshTokenPayload;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Refresh token expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    organizationId: string;
  }): { accessToken: string; refreshToken: string } {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken({
      id: user.id,
      email: user.email,
      tokenVersion: 1 // For future token invalidation
    });

    return { accessToken, refreshToken };
  }

  /**
   * Set authentication cookies
   */
  static async setAuthCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();

    // Set access token cookie (short-lived)
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });

    // Set refresh token cookie (long-lived)
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
  }

  /**
   * Clear authentication cookies
   */
  static async clearAuthCookies() {
    const cookieStore = await cookies();

    cookieStore.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    cookieStore.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
  }

  /**
   * Get user from access token cookie
   */
  static async getUserFromCookie(): Promise<JWTPayload | null> {
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;

      if (!accessToken) {
        return null;
      }

      return this.verifyAccessToken(accessToken);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get refresh token from cookie
   */
  static async getRefreshTokenFromCookie(): Promise<string | null> {
    try {
      const cookieStore = await cookies();
      return cookieStore.get('refreshToken')?.value || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: JWTPayload } | null> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // Here you would typically check if the user still exists and is active
      // For now, we'll trust the refresh token

      const userPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        id: decoded.id,
        email: decoded.email,
        role: 'user', // This should be fetched from database
        organizationId: 'org-1' // This should be fetched from database
      };

      const newAccessToken = this.signAccessToken(userPayload);

      return {
        accessToken: newAccessToken,
        user: { ...userPayload, iat: undefined, exp: undefined } as JWTPayload
      };
    } catch (error) {
      return null;
    }
  }
}
