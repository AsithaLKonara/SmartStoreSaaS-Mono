export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;

    // Get all integrations for the organization
    const integrations = await prisma.channel_integrations.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    // Get specific integration statuses
    const whatsappIntegration = await prisma.whatsapp_integrations.findFirst({
      where: { organizationId },
    });

    const woocommerceIntegrations = await prisma.woocommerce_integrations.findMany({
      where: { organizationId },
    });

    const socialCommerce = await prisma.social_commerce.findMany({
      where: { organizationId },
    });

    const status = {
      whatsapp: {
        connected: !!whatsappIntegration?.isActive,
        lastSync: whatsappIntegration?.lastSync,
        phoneNumber: whatsappIntegration?.phoneNumber,
      },
      woocommerce: {
        connected: woocommerceIntegrations.length > 0,
        stores: woocommerceIntegrations.length,
        lastSync: woocommerceIntegrations[0]?.lastSync,
      },
      socialCommerce: {
        connected: socialCommerce.length > 0,
        platforms: socialCommerce.map(sc => sc.platform),
        lastSync: socialCommerce[0]?.lastSync,
      },
      general: {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.isActive).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, config, organizationId } = body;

    if (!type || !config) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orgId = organizationId || session.user.organizationId;

    let result;

    switch (type) {
      case 'whatsapp':
        result = await setupWhatsAppIntegration(orgId, config);
        break;
      case 'woocommerce':
        result = await setupWooCommerceIntegration(orgId, config);
        break;
      case 'courier':
        result = await setupCourierIntegration(orgId, config);
        break;
      case 'social_commerce':
        result = await setupSocialCommerceIntegration(orgId, config);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Unsupported integration type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${type} integration setup successfully`,
    });
  } catch (error) {
    console.error('Error setting up integration:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to setup integration' },
      { status: 500 }
    );
  }
}

async function setupWhatsAppIntegration(organizationId: string, config: any) {
  const { phoneNumberId, accessToken, webhookSecret } = config;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing required WhatsApp configuration');
  }

  // Check if integration already exists
  const existing = await prisma.whatsapp_integrations.findFirst({
    where: { organizationId },
  });

  if (existing) {
    // Update existing integration
    return await prisma.whatsapp_integrations.update({
      where: { id: existing.id },
      data: {
        phoneNumber: phoneNumberId,
        accessToken,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({ webhookSecret }),
      },
    });
  } else {
    // Create new integration
    return await prisma.whatsapp_integrations.create({
      data: {
        id: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        phoneNumber: phoneNumberId,
        accessToken,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({ webhookSecret }),
      },
    });
  }
}

async function setupWooCommerceIntegration(organizationId: string, config: any) {
  const { storeUrl, consumerKey, consumerSecret, apiVersion } = config;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error('Missing required WooCommerce configuration');
  }

  // Check if integration already exists for this store
  const existing = await prisma.woocommerce_integrations.findFirst({
    where: { organizationId, storeUrl },
  });

  if (existing) {
    // Update existing integration
    return await prisma.woocommerce_integrations.update({
      where: { id: existing.id },
      data: {
        consumerKey,
        consumerSecret,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({ apiVersion: apiVersion || 'wc/v3' }),
      },
    });
  } else {
    // Create new integration
    return await prisma.woocommerce_integrations.create({
      data: {
        id: `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        storeUrl,
        consumerKey,
        consumerSecret,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({ apiVersion: apiVersion || 'wc/v3' }),
      },
    });
  }
}

async function setupCourierIntegration(organizationId: string, config: any) {
  const { name, code, apiKey, apiSecret } = config;

  if (!name || !code || !apiKey) {
    throw new Error('Missing required courier configuration');
  }

  // Check if courier already exists
  const existing = await prisma.couriers.findFirst({
    where: { organizationId, name },
  });

  if (existing) {
    // Update existing courier
    return await prisma.couriers.update({
      where: { id: existing.id },
      data: {
        name,
        email: config.email,
        phone: config.phone,
        isActive: true,
      },
    });
  } else {
    // Create new courier
    return await prisma.couriers.create({
      data: {
        id: `courier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        name,
        email: config.email,
        phone: config.phone,
        isActive: true,
      },
    });
  }
}

async function setupSocialCommerceIntegration(organizationId: string, config: any) {
  const { platform, accessToken, refreshToken, expiresAt } = config;

  if (!platform || !accessToken) {
    throw new Error('Missing required social commerce configuration');
  }

  // Check if integration already exists for this platform
  const existing = await prisma.social_commerce.findFirst({
    where: { organizationId, platform },
  });

  if (existing) {
    // Update existing integration
    return await prisma.social_commerce.update({
      where: { id: existing.id },
      data: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        lastSync: new Date(),
        settings: JSON.stringify(config.settings || {}),
      },
    });
  } else {
    // Create new integration
    return await prisma.social_commerce.create({
      data: {
        id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        platform,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        lastSync: new Date(),
        settings: JSON.stringify(config.settings || {}),
      },
    });
  }
}
