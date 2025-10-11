/**
 * Customer Registration API
 * Separate registration flow for customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customer-registration - Register new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address, organizationId } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists (in User or Customer)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Email already registered as customer' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Determine organization ID
    const orgId = organizationId || 'seed-org-1-1759434570099'; // Default org

    // Create user account with CUSTOMER role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'CUSTOMER',
        organizationId: orgId,
        isActive: true,
        phone,
      },
    });

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        id: user.id, // Same ID as user for easy linking
        name,
        email,
        phone: phone || null,
        address: address ? JSON.stringify(address) : null,
        organizationId: orgId,
      },
    });

    // Create default wishlist
    await prisma.wishlists.create({
      data: {
        id: `wishlist-${user.id}`,
        customerId: user.id,
        name: 'My Wishlist',
        isPublic: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        customerId: customer.id,
        email: user.email,
        name: user.name,
      },
      message: 'Customer registered successfully. You can now login.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customer-registration/check-email - Check if email is available
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    const customerExists = await prisma.customer.findFirst({
      where: { email },
      select: { id: true }
    });

    const available = !userExists && !customerExists;

    return NextResponse.json({
      success: true,
      data: {
        email,
        available,
      }
    });
  } catch (error: any) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check email' },
      { status: 500 }
    );
  }
}

