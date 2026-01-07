export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || uuidv4();
  
  try {
    logger.info({
      message: 'Starting database seeding via API',
      correlation: correlationId
    });

    // Create test organization with correct fields
    const organization = await prisma.organization.create({
      data: {
        name: 'SmartStore Demo Organization',
        domain: 'smartstore-demo.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: JSON.stringify({
          description: 'Demo organization for testing',
          website: 'https://smartstore-demo.com',
          currency: 'USD',
          timezone: 'UTC',
        }),
      },
    });

    // Create test admin user
    const hashedPassword = await hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@smartstore.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        organizationId: organization.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Create test regular user
    const hashedPassword2 = await hash('user123', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@smartstore.com',
        name: 'Regular User',
        password: hashedPassword2,
        role: 'STAFF',
        organizationId: organization.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    logger.info({
      message: 'Database seeded successfully',
      context: {
        organizationId: organization.id,
        adminUserId: adminUser.id,
        regularUserId: regularUser.id
      },
      correlation: correlationId
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
        },
        users: [
          {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            password: 'admin123', // For testing only
          },
          {
            id: regularUser.id,
            email: regularUser.email,
            role: regularUser.role,
            password: 'user123', // For testing only
          },
        ],
      },
    });

  } catch (error) {
    logger.error({
      message: 'Seeding error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      },
      correlation: correlationId
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}