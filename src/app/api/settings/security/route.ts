import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization settings that contain security configuration
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Extract security settings from organization settings
    const securitySettings = organization.settings?.security || {
      passwordPolicy: {
        minLength: 8,
        expiryDays: 90,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true
      },
      mfa: {
        enabled: true,
        requiredForAdmin: true
      },
      session: {
        timeout: 30,
        maxConcurrent: 3
      }
    };

    return NextResponse.json(securitySettings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
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

    // Only admins can modify security settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { passwordPolicy, mfa, session: sessionSettings } = body;

    // Validate security settings structure
    if (!passwordPolicy || !mfa || !sessionSettings) {
      return NextResponse.json(
        { error: 'Invalid security settings structure' },
        { status: 400 }
      );
    }

    // Get current organization settings
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update security settings within organization settings
    const updatedSettings = {
      ...organization.settings,
      security: {
        passwordPolicy: {
          minLength: Math.max(6, Math.min(32, passwordPolicy.minLength || 8)),
          expiryDays: Math.max(30, Math.min(365, passwordPolicy.expiryDays || 90)),
          requireUppercase: !!passwordPolicy.requireUppercase,
          requireNumbers: !!passwordPolicy.requireNumbers,
          requireSymbols: !!passwordPolicy.requireSymbols
        },
        mfa: {
          enabled: !!mfa.enabled,
          requiredForAdmin: !!mfa.requiredForAdmin
        },
        session: {
          timeout: Math.max(5, Math.min(480, sessionSettings.timeout || 30)),
          maxConcurrent: Math.max(1, Math.min(10, sessionSettings.maxConcurrent || 3))
        }
      }
    };

    // Update organization with new security settings
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { settings: updatedSettings }
    });

    return NextResponse.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
