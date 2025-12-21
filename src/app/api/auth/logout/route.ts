import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';

export async function POST() {
  try {
    // Clear authentication cookies
    await JWTUtils.clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
