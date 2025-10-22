/**
 * Test API: Create Organization
 * 
 * Only available in test/development environments
 * Quickly creates organizations for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Guard: Only allow in test environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
  throw new Error('Test endpoints are disabled in production');
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { name, domain, plan, description } = data;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      );
    }
    
    const org = await prisma.organization.create({
      data: {
        name,
        domain: domain || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        description: description || `Test organization: ${name}`,
        status: 'ACTIVE',
        plan: plan || 'PRO',
      },
    });
    
    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error: any) {
    console.error('Organization creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

