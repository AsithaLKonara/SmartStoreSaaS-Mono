/**
 * Customer Self-Registration API Route
 * 
 * Authorization:
 * - POST: Public (no auth required for registration)
 * - Creates customer account with CUSTOMER role
 * 
 * Organization: Must specify organizationId or domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    const { name, email, password, phone, organizationId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with CUSTOMER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER',
        organizationId,
        isActive: true,
        emailVerified: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Create customer record
    await prisma.customer.create({
      data: {
        id: user.id,
        name,
        email,
        phone,
        organizationId
      }
    });

    // Initialize loyalty
    await prisma.customerLoyalty.create({
      data: {
        id: user.id,
        customerId: user.id,
        points: 0,
        tier: 'BRONZE',
        totalSpent: 0
      }
    });

    logger.info({
      message: 'Customer self-registered',
      context: {
        userId: user.id,
        email,
        organizationId
      }
    });

    return NextResponse.json(successResponse({
      user,
      message: 'Registration successful'
    }), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Customer registration failed',
      error: error,
      context: { email: body?.email }
    });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Registration failed'
    }, { status: error.statusCode || 500 });
  }
}

