import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get social commerce integrations
        const integrations = await prisma.socialCommerce.findMany({
          where: {
            organizationId: user.organizationId,
          },
          select: {
            id: true,
            platform: true,
            isActive: true,
            lastSync: true,
            createdAt: true,
          },
        });

        return NextResponse.json({
          integrations,
        });

      case 'POST':
        // Configure social commerce integration
        const { platform, accessToken, refreshToken, expiresAt, settings } = await request.json();

        if (!platform || !accessToken) {
          return NextResponse.json(
            { error: 'Missing required fields: platform, accessToken' },
            { status: 400 }
          );
        }

        // Validate platform
        const validPlatforms = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER'];
        if (!validPlatforms.includes(platform.toUpperCase())) {
          return NextResponse.json(
            { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
            { status: 400 }
          );
        }

        // Check if integration already exists for this platform
        const existingIntegration = await prisma.socialCommerce.findFirst({
          where: {
            organizationId: user.organizationId,
            platform: platform.toUpperCase(),
          },
        });

        const defaultSettings = {
          autoPost: false,
          syncProducts: true,
          syncOrders: true,
          postFrequency: 'daily',
          hashtags: [],
          ...settings,
        };

        if (existingIntegration) {
          // Update existing integration
          const updatedIntegration = await prisma.socialCommerce.update({
            where: { id: existingIntegration.id },
            data: {
              accessToken,
              refreshToken,
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              isActive: true,
              settings: JSON.stringify(defaultSettings),
            },
          });

          return NextResponse.json({
            message: `${platform} integration updated successfully`,
            integration: {
              id: updatedIntegration.id,
              platform: updatedIntegration.platform,
              isActive: updatedIntegration.isActive,
              settings: defaultSettings,
            },
          });
        } else {
          // Create new integration
          const newIntegration = await prisma.socialCommerce.create({
            data: {
              organizationId: user.organizationId,
              platform: platform.toUpperCase(),
              accessToken,
              refreshToken,
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              isActive: true,
              settings: JSON.stringify(defaultSettings),
            },
          });

          return NextResponse.json(
            {
              message: `${platform} integration configured successfully`,
              integration: {
                id: newIntegration.id,
                platform: newIntegration.platform,
                isActive: newIntegration.isActive,
                settings: defaultSettings,
              },
            },
            { status: 201 }
          );
        }

      case 'PUT':
        // Update social commerce integration settings
        const updateData = await request.json();
        const { integrationId, isActive, settings: newSettings } = updateData;

        if (!integrationId) {
          return NextResponse.json(
            { error: 'Missing required field: integrationId' },
            { status: 400 }
          );
        }

        const integrationToUpdate = await prisma.socialCommerce.findFirst({
          where: {
            id: integrationId,
            organizationId: user.organizationId,
          },
        });

        if (!integrationToUpdate) {
          return NextResponse.json(
            { error: 'Social commerce integration not found' },
            { status: 404 }
          );
        }

        const updatedIntegration = await prisma.socialCommerce.update({
          where: { id: integrationId },
          data: {
            isActive: isActive !== undefined ? isActive : integrationToUpdate.isActive,
            settings: newSettings ? JSON.stringify(newSettings) : integrationToUpdate.settings,
          },
        });

        return NextResponse.json({
          message: 'Social commerce integration updated successfully',
          integration: {
            id: updatedIntegration.id,
            platform: updatedIntegration.platform,
            isActive: updatedIntegration.isActive,
            settings: updatedIntegration.settings ? JSON.parse(updatedIntegration.settings) : {},
          },
        });

      case 'DELETE':
        // Disconnect social commerce integration
        const { integrationId: deleteIntegrationId } = await request.json();

        if (!deleteIntegrationId) {
          return NextResponse.json(
            { error: 'Missing required field: integrationId' },
            { status: 400 }
          );
        }

        const integrationToDelete = await prisma.socialCommerce.findFirst({
          where: {
            id: deleteIntegrationId,
            organizationId: user.organizationId,
          },
        });

        if (!integrationToDelete) {
          return NextResponse.json(
            { error: 'Social commerce integration not found' },
            { status: 404 }
          );
        }

        await prisma.socialCommerce.update({
          where: { id: deleteIntegrationId },
          data: { isActive: false },
        });

        return NextResponse.json({
          message: 'Social commerce integration disconnected successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Social Commerce Integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.SETTINGS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SETTINGS_WRITE],
});

export const PUT = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.SETTINGS_WRITE],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SETTINGS_WRITE],
});
