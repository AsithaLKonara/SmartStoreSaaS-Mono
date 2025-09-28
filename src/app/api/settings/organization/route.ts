import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        domain: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    let { name, domain, description, settings } = body;

    // Validate required fields - only require name if it's being updated
    if (name === undefined) {
      // If name is not provided, fetch the existing organization to get current name
      const existingOrg = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { name: true }
      });
      
      if (!existingOrg) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      
      // Use existing name if not provided
      name = existingOrg.name;
    }

    // Check if domain is already taken by another organization
    if (domain) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          domain: domain,
          id: { not: session.user.organizationId }
        }
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Domain is already taken by another organization' },
          { status: 400 }
        );
      }
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name,
        domain: domain || null,
        settings: {
          ...settings,
          description: description || null
        }
      },
      select: {
        id: true,
        name: true,
        domain: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}