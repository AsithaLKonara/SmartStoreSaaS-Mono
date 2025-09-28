import { NextRequest, NextResponse } from 'next/server';
import dbManager from '@/lib/database';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      password,
      selectedPackageId,
      paymentChoice
    } = body;

    // Validate required fields
    if (!businessName || !contactName || !email || !phone || !password || !selectedPackageId || !paymentChoice) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await dbManager.executeWithRetry(
      async (prisma) => await prisma.user.findUnique({
        where: { email }
      }),
      'check existing user'
    );

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if registration request already exists
    const existingRequest = await dbManager.executeWithRetry(
      async (prisma) => await prisma.registrationRequest.findUnique({
        where: { email }
      }),
      'check existing registration request'
    );

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Registration request already exists for this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create registration request
    const registrationRequest = await dbManager.executeWithRetry(
      async (prisma) => await prisma.registrationRequest.create({
        data: {
          businessName,
          contactName,
          email,
          phone,
          address: {
            street: address.street,
            city: address.city,
            district: address.district,
            postalCode: address.postalCode
          },
          packageId: selectedPackageId,
          requestedPlan: paymentChoice.toUpperCase(),
          status: 'PENDING'
        }
      }),
      'create registration request'
    );

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted successfully',
      data: {
        id: registrationRequest.id,
        status: registrationRequest.status
      }
    });

  } catch (error) {
    console.error('Registration request error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


