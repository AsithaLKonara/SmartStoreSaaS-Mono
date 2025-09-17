import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Auth test request:', { email, hasPassword: !!password });
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        debug: { email, userExists: false }
      }, { status: 401 });
    }
    
    if (!user.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'User account is inactive',
        debug: { email, isActive: false }
      }, { status: 401 });
    }
    
    if (!user.password) {
      return NextResponse.json({ 
        success: false, 
        error: 'No password set for user',
        debug: { email, hasPassword: false }
      }, { status: 401 });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        debug: { email, passwordValid: false }
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization?.name
      },
      debug: {
        email,
        userExists: true,
        isActive: true,
        hasPassword: true,
        passwordValid: true
      }
    });
    
  } catch (error) {
    console.error('❌ Auth test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Get user count
    const userCount = await prisma.user.count();
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };
    
    return NextResponse.json({
      success: true,
      database: 'Connected',
      userCount,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Auth test GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
}
