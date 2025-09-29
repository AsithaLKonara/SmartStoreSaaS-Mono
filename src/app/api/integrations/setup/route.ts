import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function setupIntegration(request: AuthRequest) {
  try {
    const body = await request.json();
    const { integrationType, config } = body;
    const organizationId = request.user!.organizationId;

    if (!integrationType || !config) {
      return NextResponse.json(
        { error: 'Integration type and configuration are required' },
        { status: 400 }
      );
    }

    let result;

    switch (integrationType) {
      case 'whatsapp':
        result = await setupWhatsAppIntegration(organizationId, config);
        break;
      case 'woocommerce':
        result = await setupWooCommerceIntegration(organizationId, config);
        break;
      case 'courier':
        result = await setupCourierIntegration(organizationId, config);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid integration type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${integrationType} integration setup completed successfully`
    });

  } catch (error) {
    console.error('Integration setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getIntegrationStatus(request: AuthRequest) {
  try {
    const organizationId = request.user!.organizationId;

    // Get integration status for organization
    const integrations = await getOrganizationIntegrations(organizationId);

    return NextResponse.json({
      success: true,
      data: integrations
    });

  } catch (error) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function setupWhatsAppIntegration(organizationId: string, config: any) {
  // Simplified WhatsApp integration setup
  const integration = {
    id: `whatsapp_${Date.now()}`,
    organizationId,
    type: 'whatsapp',
    isActive: true,
    config: {
      phoneNumber: config.phoneNumber,
      apiKey: config.apiKey,
      webhookUrl: config.webhookUrl
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    lastSync: null
  };

  // Simulate saving to database
  console.log('Simulating WhatsApp integration setup:', integration);

  return integration;
}

async function setupWooCommerceIntegration(organizationId: string, config: any) {
  // Simplified WooCommerce integration setup
  const integration = {
    id: `woocommerce_${Date.now()}`,
    organizationId,
    type: 'woocommerce',
    isActive: true,
    config: {
      storeUrl: config.storeUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    lastSync: null
  };

  // Simulate saving to database
  console.log('Simulating WooCommerce integration setup:', integration);

  return integration;
}

async function setupCourierIntegration(organizationId: string, config: any) {
  // Simplified courier integration setup
  const integration = {
    id: `courier_${Date.now()}`,
    organizationId,
    type: 'courier',
    isActive: true,
    config: {
      provider: config.provider,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    lastSync: null
  };

  // Simulate saving to database
  console.log('Simulating courier integration setup:', integration);

  return integration;
}

async function getOrganizationIntegrations(organizationId: string) {
  // Simplified integration status
  return {
    whatsapp: {
      isConnected: false,
      status: 'not_configured',
      lastSync: null
    },
    woocommerce: {
      isConnected: false,
      status: 'not_configured',
      lastSync: null
    },
    courier: {
      isConnected: false,
      status: 'not_configured',
      lastSync: null
    }
  };
}

export const POST = createAuthHandler(setupIntegration, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});

export const GET = createAuthHandler(getIntegrationStatus, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});