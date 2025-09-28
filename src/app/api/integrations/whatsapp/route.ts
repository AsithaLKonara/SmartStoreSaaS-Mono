import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get WhatsApp integration status and configuration
        const integration = await prisma.whatsAppIntegration.findFirst({
          where: {
            organizationId: user.organizationId,
          },
          select: {
            id: true,
            phoneNumber: true,
            isActive: true,
            lastSync: true,
            syncSettings: true,
            createdAt: true,
          },
        });

        if (!integration) {
          return NextResponse.json({
            connected: false,
            message: 'WhatsApp integration not configured',
          });
        }

        return NextResponse.json({
          connected: true,
          integration: {
            ...integration,
            syncSettings: integration.syncSettings ? JSON.parse(integration.syncSettings) : {},
          },
          status: integration.isActive ? 'active' : 'inactive',
        });

      case 'POST':
        // Configure WhatsApp integration
        const { phoneNumber, accessToken, autoReply, businessHours, timezone } = await request.json();

        if (!phoneNumber || !accessToken) {
          return NextResponse.json(
            { error: 'Missing required fields: phoneNumber, accessToken' },
            { status: 400 }
          );
        }

        // Validate phone number format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          return NextResponse.json(
            { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
            { status: 400 }
          );
        }

        // Check if integration already exists
        const existingIntegration = await prisma.whatsAppIntegration.findFirst({
          where: {
            organizationId: user.organizationId,
          },
        });

        const syncSettings = {
          autoReply: autoReply || false,
          businessHours: businessHours || '09:00-17:00',
          timezone: timezone || 'Asia/Colombo',
          welcomeMessage: 'Hello! Welcome to our store. How can we help you today?',
          awayMessage: 'We are currently away. We will get back to you soon!',
          quickReplies: [
            'Order Status',
            'Product Information',
            'Support',
            'Speak to Agent',
          ],
        };

        if (existingIntegration) {
          // Update existing integration
          const updatedIntegration = await prisma.whatsAppIntegration.update({
            where: { id: existingIntegration.id },
            data: {
              phoneNumber,
              accessToken,
              isActive: true,
              lastSync: new Date(),
              syncSettings: JSON.stringify(syncSettings),
            },
          });

          return NextResponse.json({
            message: 'WhatsApp integration updated successfully',
            integration: {
              id: updatedIntegration.id,
              phoneNumber: updatedIntegration.phoneNumber,
              isActive: updatedIntegration.isActive,
              syncSettings,
            },
          });
        } else {
          // Create new integration
          const newIntegration = await prisma.whatsAppIntegration.create({
            data: {
              organizationId: user.organizationId,
              phoneNumber,
              accessToken,
              isActive: true,
              lastSync: new Date(),
              syncSettings: JSON.stringify(syncSettings),
            },
          });

          return NextResponse.json(
            {
              message: 'WhatsApp integration configured successfully',
              integration: {
                id: newIntegration.id,
                phoneNumber: newIntegration.phoneNumber,
                isActive: newIntegration.isActive,
                syncSettings,
              },
            },
            { status: 201 }
          );
        }

      case 'PUT':
        // Update WhatsApp integration settings
        const updateData = await request.json();
        const { isActive, syncSettings: newSyncSettings } = updateData;

        const integrationToUpdate = await prisma.whatsAppIntegration.findFirst({
          where: {
            organizationId: user.organizationId,
          },
        });

        if (!integrationToUpdate) {
          return NextResponse.json(
            { error: 'WhatsApp integration not found' },
            { status: 404 }
          );
        }

        const updatedIntegration = await prisma.whatsAppIntegration.update({
          where: { id: integrationToUpdate.id },
          data: {
            isActive: isActive !== undefined ? isActive : integrationToUpdate.isActive,
            syncSettings: newSyncSettings ? JSON.stringify(newSyncSettings) : integrationToUpdate.syncSettings,
          },
        });

        return NextResponse.json({
          message: 'WhatsApp integration updated successfully',
          integration: {
            id: updatedIntegration.id,
            isActive: updatedIntegration.isActive,
            syncSettings: updatedIntegration.syncSettings ? JSON.parse(updatedIntegration.syncSettings) : {},
          },
        });

      case 'DELETE':
        // Disconnect WhatsApp integration
        const integrationToDelete = await prisma.whatsAppIntegration.findFirst({
          where: {
            organizationId: user.organizationId,
          },
        });

        if (!integrationToDelete) {
          return NextResponse.json(
            { error: 'WhatsApp integration not found' },
            { status: 404 }
          );
        }

        await prisma.whatsAppIntegration.update({
          where: { id: integrationToDelete.id },
          data: { isActive: false },
        });

        return NextResponse.json({
          message: 'WhatsApp integration disconnected successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('WhatsApp Integration API error:', error);
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
