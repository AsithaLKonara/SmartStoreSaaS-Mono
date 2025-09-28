import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get organization features
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { features: true }
    });

    const features = organization?.features || {};

    // Default feature categories (this would typically come from a database)
    const defaultCategories = [
      {
        id: 'core',
        name: 'Core Features',
        description: 'Essential business functionality',
        icon: 'Settings',
        features: [
          {
            id: 'orders',
            name: 'Order Management',
            description: 'Create, track, and manage customer orders',
            category: 'core',
            enabled: true,
            required: true,
            icon: 'ShoppingCart',
            dependencies: [],
            impact: 'high'
          },
          {
            id: 'products',
            name: 'Product Catalog',
            description: 'Manage product inventory and catalog',
            category: 'core',
            enabled: true,
            required: true,
            icon: 'Package',
            dependencies: [],
            impact: 'high'
          },
          {
            id: 'customers',
            name: 'Customer Management',
            description: 'Manage customer information and relationships',
            category: 'core',
            enabled: true,
            required: true,
            icon: 'Users',
            dependencies: [],
            impact: 'high'
          }
        ]
      },
      {
        id: 'courier',
        name: 'Courier & Delivery',
        description: 'Delivery management and tracking',
        icon: 'Truck',
        features: [
          {
            id: 'courier_tracking',
            name: 'Courier Tracking',
            description: 'Real-time courier location and delivery tracking',
            category: 'courier',
            enabled: features.courier_tracking !== false,
            required: false,
            icon: 'Truck',
            dependencies: ['orders'],
            impact: 'high'
          },
          {
            id: 'label_printing',
            name: 'Label Printing',
            description: 'Print delivery labels and shipping documents',
            category: 'courier',
            enabled: features.label_printing !== false,
            required: false,
            icon: 'Package',
            dependencies: ['courier_tracking'],
            impact: 'medium'
          },
          {
            id: 'delivery_status',
            name: 'Delivery Status Updates',
            description: 'Automated delivery status notifications',
            category: 'courier',
            enabled: features.delivery_status !== false,
            required: false,
            icon: 'CheckCircle',
            dependencies: ['courier_tracking'],
            impact: 'medium'
          }
        ]
      },
      {
        id: 'analytics',
        name: 'Analytics & Reporting',
        description: 'Business intelligence and reporting',
        icon: 'BarChart3',
        features: [
          {
            id: 'basic_analytics',
            name: 'Basic Analytics',
            description: 'Sales and performance metrics',
            category: 'analytics',
            enabled: features.basic_analytics !== false,
            required: false,
            icon: 'BarChart3',
            dependencies: ['orders'],
            impact: 'medium'
          },
          {
            id: 'advanced_analytics',
            name: 'Advanced Analytics',
            description: 'AI-powered insights and predictions',
            category: 'analytics',
            enabled: features.advanced_analytics !== false,
            required: false,
            icon: 'Brain',
            dependencies: ['basic_analytics'],
            impact: 'high'
          },
          {
            id: 'custom_reports',
            name: 'Custom Reports',
            description: 'Create and schedule custom reports',
            category: 'analytics',
            enabled: features.custom_reports === true,
            required: false,
            icon: 'TrendingUp',
            dependencies: ['advanced_analytics'],
            impact: 'low'
          }
        ]
      },
      {
        id: 'payments',
        name: 'Payments & Billing',
        description: 'Payment processing and billing',
        icon: 'CreditCard',
        features: [
          {
            id: 'stripe_payments',
            name: 'Stripe Payments',
            description: 'Process payments via Stripe',
            category: 'payments',
            enabled: features.stripe_payments !== false,
            required: false,
            icon: 'CreditCard',
            dependencies: ['orders'],
            impact: 'high'
          },
          {
            id: 'paypal_payments',
            name: 'PayPal Payments',
            description: 'Process payments via PayPal',
            category: 'payments',
            enabled: features.paypal_payments !== false,
            required: false,
            icon: 'CreditCard',
            dependencies: ['orders'],
            impact: 'medium'
          },
          {
            id: 'cod_payments',
            name: 'Cash on Delivery',
            description: 'Accept cash payments on delivery',
            category: 'payments',
            enabled: features.cod_payments !== false,
            required: false,
            icon: 'CreditCard',
            dependencies: ['courier_tracking'],
            impact: 'medium'
          }
        ]
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Customer communication tools',
        icon: 'MessageSquare',
        features: [
          {
            id: 'email_notifications',
            name: 'Email Notifications',
            description: 'Send email notifications to customers',
            category: 'communication',
            enabled: features.email_notifications !== false,
            required: false,
            icon: 'MessageSquare',
            dependencies: ['orders'],
            impact: 'medium'
          },
          {
            id: 'sms_notifications',
            name: 'SMS Notifications',
            description: 'Send SMS notifications to customers',
            category: 'communication',
            enabled: features.sms_notifications === true,
            required: false,
            icon: 'MessageSquare',
            dependencies: ['email_notifications'],
            impact: 'low'
          },
          {
            id: 'whatsapp_integration',
            name: 'WhatsApp Integration',
            description: 'Send notifications via WhatsApp',
            category: 'communication',
            enabled: features.whatsapp_integration === true,
            required: false,
            icon: 'MessageSquare',
            dependencies: ['sms_notifications'],
            impact: 'low'
          }
        ]
      },
      {
        id: 'integrations',
        name: 'Integrations',
        description: 'Third-party service integrations',
        icon: 'Globe',
        features: [
          {
            id: 'woocommerce',
            name: 'WooCommerce Integration',
            description: 'Sync with WooCommerce stores',
            category: 'integrations',
            enabled: features.woocommerce === true,
            required: false,
            icon: 'Globe',
            dependencies: ['products'],
            impact: 'medium'
          },
          {
            id: 'facebook_shop',
            name: 'Facebook Shop',
            description: 'Sync products with Facebook Shop',
            category: 'integrations',
            enabled: features.facebook_shop === true,
            required: false,
            icon: 'Globe',
            dependencies: ['products'],
            impact: 'low'
          },
          {
            id: 'google_analytics',
            name: 'Google Analytics',
            description: 'Track website analytics',
            category: 'integrations',
            enabled: features.google_analytics === true,
            required: false,
            icon: 'BarChart3',
            dependencies: [],
            impact: 'low'
          }
        ]
      }
    ];

    return NextResponse.json({ categories: defaultCategories });

  } catch (error) {
    console.error('Error fetching feature settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId, featureId, enabled } = await request.json();

    if (!categoryId || !featureId || typeof enabled !== 'boolean') {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Get current organization features
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { features: true }
    });

    const currentFeatures = organization?.features || {};
    const updatedFeatures = {
      ...currentFeatures,
      [featureId]: enabled
    };

    // Update organization features
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { features: updatedFeatures }
    });

    // Log the feature change
    await prisma.activity.create({
      data: {
        type: 'FEATURE_TOGGLED',
        description: `Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`,
        userId: session.user.id,
        metadata: {
          featureId,
          categoryId,
          enabled,
          organizationId: session.user.organizationId
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feature setting updated successfully'
    });

  } catch (error) {
    console.error('Error updating feature setting:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { categories } = await request.json();

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Extract feature settings from categories
    const featureSettings: Record<string, boolean> = {};
    categories.forEach((category: any) => {
      if (category.features && Array.isArray(category.features)) {
        category.features.forEach((feature: any) => {
          if (feature.id && typeof feature.enabled === 'boolean') {
            featureSettings[feature.id] = feature.enabled;
          }
        });
      }
    });

    // Update organization features
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { features: featureSettings }
    });

    // Log the bulk feature update
    await prisma.activity.create({
      data: {
        type: 'FEATURES_BULK_UPDATE',
        description: 'Multiple feature settings updated',
        userId: session.user.id,
        metadata: {
          featureSettings,
          organizationId: session.user.organizationId
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'All feature settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating feature settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}