import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Input validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  organizationSlug: z.string().min(2, 'Organization slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { email, password, name, organizationName, organizationSlug } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User with this email already exists' 
        }, 
        { status: 409 }
      );
    }

    // Check if organization domain is available (using domain instead of slug)
    const existingOrg = await prisma.organization.findUnique({
      where: { domain: organizationSlug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Organization domain is already taken' 
        }, 
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          domain: organizationSlug,
          description: `Organization for ${organizationName}`,
          status: 'ACTIVE',
          settings: JSON.stringify({
            currency: 'USD',
            timezone: 'UTC',
            language: 'en',
            taxRate: 0,
            shippingMethods: ['standard'],
            paymentMethods: ['stripe'],
            notifications: {
              email: true,
              sms: false,
              whatsapp: false
            }
          })
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          organizationId: organization.id
        }
      });

      return { organization, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '15m' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: result.user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      { expiresIn: '7d' }
    );

    // Note: Activity logging removed as Activity model doesn't exist in current schema

    // Set secure cookies
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          organizationId: result.user.organizationId,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          domain: result.organization.domain,
          status: result.organization.status,
        },
        token,
      },
      message: 'Registration successful',
    });

    // Set secure cookies
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}
