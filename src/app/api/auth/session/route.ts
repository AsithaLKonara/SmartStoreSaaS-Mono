import { NextRequest, NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const user = await JWTUtils.getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, message: 'Session validation failed' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 400 }
      );
    }

    const refreshResult = await JWTUtils.refreshAccessToken(refreshToken);

    if (!refreshResult) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Set new access token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed',
      user: {
        id: refreshResult.user.id,
        email: refreshResult.user.email,
        name: refreshResult.user.name,
        role: refreshResult.user.role,
        organizationId: refreshResult.user.organizationId,
      },
    });

    response.cookies.set('accessToken', refreshResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 401 }
    );
  }
}
