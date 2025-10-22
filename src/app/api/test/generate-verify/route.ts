/**
 * Test API: Generate Verification Token
 * 
 * Only available in test/development environments
 * Generates email verification tokens for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Guard: Only allow in test environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
  throw new Error('Test endpoints are disabled in production');
}

// In-memory token storage for testing
const verificationTokens = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Generate token
    const token = randomBytes(32).toString('hex');
    
    // Store token (in production, this would be in database)
    verificationTokens.set(token, email);
    
    // Auto-expire after 1 hour
    setTimeout(() => {
      verificationTokens.delete(token);
    }, 60 * 60 * 1000);
    
    return NextResponse.json({
      success: true,
      token,
      email,
    });
  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const email = verificationTokens.get(token);
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 404 }
      );
    }
    
    // Remove token after use
    verificationTokens.delete(token);
    
    return NextResponse.json({
      success: true,
      email,
      verified: true,
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

