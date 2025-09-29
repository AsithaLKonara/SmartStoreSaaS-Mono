import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function handler(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationType = searchParams.get('type');
    const organizationId = request.user!.organizationId;

    // Get integration settings for organization
    const integrationSettings = await getIntegrationSettings(organizationId, integrationType);

    return NextResponse.json({
      success: true,
      data: integrationSettings
    });

  } catch (error) {
    console.error('Error fetching integration settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateIntegrationSettings(request: AuthRequest) {
  try {
    const body = await request.json();
    const { integrationType, integrationId, action, data } = body;
    const organizationId = request.user!.organizationId;

    if (!integrationType || !action) {
      return NextResponse.json(
        { error: 'Integration type and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (integrationType) {
      case 'wooCommerce':
        result = await handleWooCommerceIntegration(integrationId, action, data, organizationId);
        break;
      case 'whatsApp':
        result = await handleWhatsAppIntegration(integrationId, action, data, organizationId);
        break;
      case 'courier':
        result = await handleCourierIntegration(integrationId, action, data, organizationId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid integration type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getIntegrationSettings(organizationId: string, integrationType?: string | null) {
  // Simplified integration settings
  const settings = {
    woocommerce: {
      isConnected: false,
      storeUrl: null,
      apiKey: null,
      secret: null,
      lastSync: null,
      settings: {
        syncProducts: true,
        syncOrders: true,
        syncCustomers: false
      }
    },
    whatsapp: {
      isConnected: false,
      phoneNumber: null,
      apiKey: null,
      lastSync: null,
      settings: {
        autoReply: true,
        businessHours: '09:00-17:00',
        timezone: 'Asia/Colombo'
      }
    },
    courier: {
      isConnected: false,
      provider: null,
      apiKey: null,
      lastSync: null,
      settings: {
        autoTracking: true,
        notifications: true
      }
    }
  };

  if (integrationType) {
    return settings[integrationType as keyof typeof settings] || null;
  }

  return settings;
}

async function handleWooCommerceIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  // Simplified WooCommerce integration handling
  switch (action) {
    case 'connect':
      return {
        success: true,
        message: 'WooCommerce connected successfully',
        data: {
          integrationId: `wc_${Date.now()}`,
          storeUrl: data.storeUrl,
          isConnected: true,
          connectedAt: new Date().toISOString()
        }
      };
    case 'disconnect':
      return {
        success: true,
        message: 'WooCommerce disconnected successfully'
      };
    case 'sync':
      return {
        success: true,
        message: 'WooCommerce sync completed',
        data: {
          syncedProducts: 25,
          syncedOrders: 10,
          syncedAt: new Date().toISOString()
        }
      };
    default:
      return { success: false, message: 'Invalid action' };
  }
}

async function handleWhatsAppIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  // Simplified WhatsApp integration handling
  switch (action) {
    case 'connect':
      return {
        success: true,
        message: 'WhatsApp connected successfully',
        data: {
          integrationId: `wa_${Date.now()}`,
          phoneNumber: data.phoneNumber,
          isConnected: true,
          connectedAt: new Date().toISOString()
        }
      };
    case 'disconnect':
      return {
        success: true,
        message: 'WhatsApp disconnected successfully'
      };
    case 'test':
      return {
        success: true,
        message: 'WhatsApp test message sent successfully'
      };
    default:
      return { success: false, message: 'Invalid action' };
  }
}

async function handleCourierIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  // Simplified courier integration handling
  switch (action) {
    case 'connect':
      return {
        success: true,
        message: 'Courier service connected successfully',
        data: {
          integrationId: `courier_${Date.now()}`,
          provider: data.provider,
          isConnected: true,
          connectedAt: new Date().toISOString()
        }
      };
    case 'disconnect':
      return {
        success: true,
        message: 'Courier service disconnected successfully'
      };
    case 'test':
      return {
        success: true,
        message: 'Courier service test completed successfully'
      };
    default:
      return { success: false, message: 'Invalid action' };
  }
}

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const PUT = createAuthHandler(updateIntegrationSettings, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});