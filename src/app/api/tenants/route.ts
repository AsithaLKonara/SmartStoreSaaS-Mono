import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tenants = organizations.map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      status: 'active',
      userCount: org._count.users,
      productCount: org._count.products,
      orderCount: org._count.orders,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    }));

    return NextResponse.json({
      success: true,
      tenants,
      data: tenants
    });
  } catch (error: any) {
    console.error('Tenants API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, slug } = body;

    const organization = await prisma.organization.create({
      data: {
        name,
        domain: domain || `${slug}.smartstore.app`,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-')
      }
    });

    return NextResponse.json({
      success: true,
      tenant: organization,
      data: organization
    });
  } catch (error: any) {
    console.error('Create tenant error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
