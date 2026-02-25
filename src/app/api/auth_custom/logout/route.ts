import { NextResponse, NextRequest } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || uuidv4();
  
  try {
    // Clear authentication cookies
    await JWTUtils.clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    logger.error({
      message: 'Logout error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      },
      correlation: correlationId
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}
