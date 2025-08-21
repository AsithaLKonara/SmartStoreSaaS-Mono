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

    // Get all integrations for the organization
    const [wooCommerceIntegrations, whatsAppIntegrations, couriers] = await Promise.all([
      prisma.wooCommerceIntegration.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          siteUrl: true,
          isActive: true,
          lastSync: true,
          syncSettings: true
        }
      }),
      prisma.whatsAppIntegration.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          phoneNumber: true,
          isActive: true,
          lastSync: true,
          syncSettings: true
        }
      }),
      prisma.courier.findMany({
        where: { 
          organizationId: session.user.organizationId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          status: true,
          isActive: true,
          createdAt: true
        }
      })
    ]);

    const integrations = {
      wooCommerce: wooCommerceIntegrations.map(integration => ({
        id: integration.id,
        type: 'WooCommerce',
        name: 'WooCommerce Store',
        status: integration.isActive ? 'Connected' : 'Not Connected',
        details: {
          siteUrl: integration.siteUrl,
          lastSync: integration.lastSync ? formatTimeAgo(integration.lastSync) : 'Never',
          syncSettings: integration.syncSettings
        }
      })),
      whatsApp: whatsAppIntegrations.map(integration => ({
        id: integration.id,
        type: 'WhatsApp',
        name: 'WhatsApp Business',
        status: integration.isActive ? 'Connected' : 'Not Connected',
        details: {
          phoneNumber: integration.phoneNumber,
          lastSync: integration.lastSync ? formatTimeAgo(integration.lastSync) : 'Never',
          syncSettings: integration.syncSettings
        }
      })),
      couriers: couriers.map(courier => ({
        id: courier.id,
        type: 'Courier',
        name: courier.name,
        status: courier.isActive ? 'Connected' : 'Not Connected',
        details: {
          status: courier.status,
          joined: formatTimeAgo(courier.createdAt)
        }
      }))
    };

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
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

    const body = await request.json();
    const { integrationType, integrationId, action, data } = body;

    if (!integrationType || !action) {
      return NextResponse.json(
        { error: 'Integration type and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (integrationType) {
      case 'wooCommerce':
        result = await handleWooCommerceIntegration(integrationId, action, data, session.user.organizationId);
        break;
      case 'whatsApp':
        result = await handleWhatsAppIntegration(integrationId, action, data, session.user.organizationId);
        break;
      case 'courier':
        result = await handleCourierIntegration(integrationId, action, data, session.user.organizationId);
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

async function handleWooCommerceIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  if (action === 'update') {
    const updatedIntegration = await prisma.wooCommerceIntegration.update({
      where: { 
        id: integrationId,
        organizationId
      },
      data: {
        siteUrl: data.siteUrl,
        consumerKey: data.consumerKey,
        consumerSecret: data.consumerSecret,
        isActive: data.isActive,
        syncSettings: data.syncSettings || {}
      }
    });
    return { message: 'WooCommerce integration updated successfully', integration: updatedIntegration };
  } else if (action === 'toggle') {
    const integration = await prisma.wooCommerceIntegration.findFirst({
      where: { 
        id: integrationId,
        organizationId
      }
    });
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    const updatedIntegration = await prisma.wooCommerceIntegration.update({
      where: { id: integrationId },
      data: { isActive: !integration.isActive }
    });
    
    return { 
      message: `WooCommerce integration ${updatedIntegration.isActive ? 'activated' : 'deactivated'} successfully`,
      integration: updatedIntegration
    };
  }
  
  throw new Error('Invalid action');
}

async function handleWhatsAppIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  if (action === 'update') {
    const updatedIntegration = await prisma.whatsAppIntegration.update({
      where: { 
        id: integrationId,
        organizationId
      },
      data: {
        phoneNumber: data.phoneNumber,
        accessToken: data.accessToken,
        isActive: data.isActive,
        webhookUrl: data.webhookUrl,
        syncSettings: data.syncSettings || {}
      }
    });
    return { message: 'WhatsApp integration updated successfully', integration: updatedIntegration };
  } else if (action === 'toggle') {
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { 
        id: integrationId,
        organizationId
      }
    });
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    const updatedIntegration = await prisma.whatsAppIntegration.update({
      where: { id: integrationId },
      data: { isActive: !integration.isActive }
    });
    
    return { 
      message: `WhatsApp integration ${updatedIntegration.isActive ? 'activated' : 'deactivated'} successfully`,
      integration: updatedIntegration
    };
  }
  
  throw new Error('Invalid action');
}

async function handleCourierIntegration(integrationId: string, action: string, data: any, organizationId: string) {
  if (action === 'update') {
    const updatedCourier = await prisma.courier.update({
      where: { 
        id: integrationId,
        organizationId
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        status: data.status,
        isActive: data.isActive
      }
    });
    return { message: 'Courier integration updated successfully', courier: updatedCourier };
  } else if (action === 'toggle') {
    const courier = await prisma.courier.findFirst({
      where: { 
        id: integrationId,
        organizationId
      }
    });
    
    if (!courier) {
      throw new Error('Courier not found');
    }

    const updatedCourier = await prisma.courier.update({
      where: { id: integrationId },
      data: { isActive: !courier.isActive }
    });
    
    return { 
      message: `Courier integration ${updatedCourier.isActive ? 'activated' : 'deactivated'} successfully`,
      courier: updatedCourier
    };
  }
  
  throw new Error('Invalid action');
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
