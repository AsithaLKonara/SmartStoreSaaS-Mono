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
    const type = searchParams.get('type');

    // If type specified, return specific integration status
    if (type) {
      let integration;
      
      switch (type) {
        case 'whatsapp':
          integration = await prisma.whatsapp_integrations.findFirst({ where: { organizationId } });
          return NextResponse.json({
            success: true,
            connected: !!integration?.isActive,
            data: integration || {}
          });
        
        case 'woocommerce':
          const wc = await prisma.woocommerce_integrations.findFirst({ where: { organizationId } });
          return NextResponse.json({
            success: true,
            connected: !!wc?.isActive,
            data: wc || {}
          });
        
        case 'shopify':
        case 'stripe':
        case 'payhere':
        case 'email':
        case 'sms':
          integration = await prisma.channel_integrations.findFirst({
            where: { organizationId, channel: type }
          });
          return NextResponse.json({
            success: true,
            connected: !!integration?.isActive,
            data: integration || {}
          });
        
        default:
          return NextResponse.json({
            success: true,
            connected: false,
            data: {}
          });
      }
    }

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
      { success: false, message: 'Failed to fetch integration status', error: error instanceof Error ? error.message : 'Unknown error' },
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
      case 'shopify':
        result = await setupShopifyIntegration(orgId, config);
        break;
      case 'stripe':
        result = await setupStripeIntegration(orgId, config);
        break;
      case 'payhere':
        result = await setupPayHereIntegration(orgId, config);
        break;
      case 'email':
        result = await setupEmailIntegration(orgId, config);
        break;
      case 'sms':
        result = await setupSMSIntegration(orgId, config);
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

async function setupShopifyIntegration(organizationId: string, config: any) {
  // Store Shopify config in channel_integrations table
  const existing = await prisma.channel_integrations.findFirst({
    where: { organizationId, channel: 'shopify' },
  });

  const configData = {
    shopName: config.shopName,
    accessToken: config.accessToken,
    apiVersion: config.apiVersion,
    syncSettings: config.syncSettings,
    syncFrequency: config.syncFrequency,
  };

  if (existing) {
    return await prisma.channel_integrations.update({
      where: { id: existing.id },
      data: {
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  } else {
    return await prisma.channel_integrations.create({
      data: {
        id: `shopify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        channel: 'shopify',
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  }
}

async function setupStripeIntegration(organizationId: string, config: any) {
  // Store Stripe config in channel_integrations table
  const existing = await prisma.channel_integrations.findFirst({
    where: { organizationId, channel: 'stripe' },
  });

  const configData = {
    publishableKey: config.publishableKey,
    secretKey: config.secretKey, // Should be encrypted in production
    webhookSecret: config.webhookSecret,
    testMode: config.testMode,
    currency: config.currency,
    statementDescriptor: config.statementDescriptor,
    paymentMethods: config.paymentMethods,
  };

  if (existing) {
    return await prisma.channel_integrations.update({
      where: { id: existing.id },
      data: {
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  } else {
    return await prisma.channel_integrations.create({
      data: {
        id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        channel: 'stripe',
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  }
}

async function setupPayHereIntegration(organizationId: string, config: any) {
  // Store PayHere config in channel_integrations table
  const existing = await prisma.channel_integrations.findFirst({
    where: { organizationId, channel: 'payhere' },
  });

  const configData = {
    merchantId: config.merchantId,
    merchantSecret: config.merchantSecret, // Should be encrypted in production
    sandbox: config.sandbox,
    currency: config.currency || 'LKR',
    returnUrl: config.returnUrl,
    cancelUrl: config.cancelUrl,
    notifyUrl: config.notifyUrl,
  };

  if (existing) {
    return await prisma.channel_integrations.update({
      where: { id: existing.id },
      data: {
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  } else {
    return await prisma.channel_integrations.create({
      data: {
        id: `payhere_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        channel: 'payhere',
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  }
}

async function setupEmailIntegration(organizationId: string, config: any) {
  // Store Email config in channel_integrations table
  const existing = await prisma.channel_integrations.findFirst({
    where: { organizationId, channel: 'email' },
  });

  const configData = {
    apiKey: config.apiKey, // Should be encrypted in production
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    replyTo: config.replyTo,
    templates: config.templates,
  };

  if (existing) {
    return await prisma.channel_integrations.update({
      where: { id: existing.id },
      data: {
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  } else {
    return await prisma.channel_integrations.create({
      data: {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        channel: 'email',
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  }
}

async function setupSMSIntegration(organizationId: string, config: any) {
  // Store SMS config in channel_integrations table
  const existing = await prisma.channel_integrations.findFirst({
    where: { organizationId, channel: 'sms' },
  });

  const configData = {
    accountSid: config.accountSid,
    authToken: config.authToken, // Should be encrypted in production
    fromPhoneNumber: config.fromPhoneNumber,
    messagingServiceSid: config.messagingServiceSid,
    templates: config.templates,
  };

  if (existing) {
    return await prisma.channel_integrations.update({
      where: { id: existing.id },
      data: {
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  } else {
    return await prisma.channel_integrations.create({
      data: {
        id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        channel: 'sms',
        config: JSON.stringify(configData),
        isActive: true,
        lastSync: new Date(),
      },
    });
  }
}
