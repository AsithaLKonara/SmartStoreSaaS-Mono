export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout request...');

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Clear cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    console.log('✅ Logout successful');
    return response;

  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
