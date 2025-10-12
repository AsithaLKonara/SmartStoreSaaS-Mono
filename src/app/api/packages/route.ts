/**
 * Subscription Packages API
 * Manage subscription plans and packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant/isolation';
import { UserRole } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: string[];
  limits: {
    users?: number;
    products?: number;
    orders?: number;
    storage?: string;
  };
  isActive: boolean;
  trialDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pkg-free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'LKR',
    interval: 'MONTHLY',
    features: [
      'Up to 50 products',
      'Up to 100 orders/month',
      'Basic analytics',
      'Email support',
    ],
    limits: {
      users: 1,
      products: 50,
      orders: 100,
      storage: '1GB',
    },
    isActive: true,
    trialDays: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pkg-basic',
    name: 'Basic',
    description: 'For small businesses',
    price: 9900,
    currency: 'LKR',
    interval: 'MONTHLY',
    features: [
      'Up to 500 products',
      'Up to 1,000 orders/month',
      'Advanced analytics',
      'WhatsApp integration',
      'Email + SMS support',
    ],
    limits: {
      users: 5,
      products: 500,
      orders: 1000,
      storage: '10GB',
    },
    isActive: true,
    trialDays: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pkg-pro',
    name: 'Professional',
    description: 'For growing businesses',
    price: 24900,
    currency: 'LKR',
    interval: 'MONTHLY',
    features: [
      'Unlimited products',
      'Unlimited orders',
      'AI-powered insights',
      'All integrations',
      'Priority support',
      'Custom domain',
      'Advanced reporting',
    ],
    limits: {
      users: 20,
      products: -1, // unlimited
      orders: -1,
      storage: '100GB',
    },
    isActive: true,
    trialDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99900,
    currency: 'LKR',
    interval: 'MONTHLY',
    features: [
      'Everything in Pro',
      'Unlimited users',
      'White-labeling',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
    ],
    limits: {
      users: -1,
      products: -1,
      orders: -1,
      storage: '1TB',
    },
    isActive: true,
    trialDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * GET /api/packages - Get all subscription packages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let packages = DEFAULT_PACKAGES;

    if (activeOnly) {
      packages = packages.filter(pkg => pkg.isActive);
    }

    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    console.error('Get packages error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/packages - Create new package (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only Super Admin can create packages
    if (context.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can create packages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, price, interval, features, limits, trialDays } = body;

    if (!name || price === undefined || !interval) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and interval are required' },
        { status: 400 }
      );
    }

    const newPackage: SubscriptionPackage = {
      id: `pkg-${Date.now()}`,
      name,
      description: description || '',
      price: parseFloat(price),
      currency: 'LKR',
      interval,
      features: features || [],
      limits: limits || {},
      isActive: true,
      trialDays: trialDays || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database:
    // await prisma.subscriptionPackage.create({ data: newPackage });

    DEFAULT_PACKAGES.push(newPackage);

    return NextResponse.json({
      success: true,
      data: newPackage,
      message: 'Package created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create package error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create package' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/packages - Update package (Super Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (context.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can update packages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const packageIndex = DEFAULT_PACKAGES.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Update package
    DEFAULT_PACKAGES[packageIndex] = {
      ...DEFAULT_PACKAGES[packageIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: DEFAULT_PACKAGES[packageIndex],
      message: 'Package updated successfully',
    });
  } catch (error: any) {
    console.error('Update package error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update package' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packages - Delete package (Super Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (context.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can delete packages' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const packageIndex = DEFAULT_PACKAGES.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Soft delete
    DEFAULT_PACKAGES[packageIndex].isActive = false;
    DEFAULT_PACKAGES[packageIndex].updatedAt = new Date();

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete package error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete package' },
      { status: 500 }
    );
  }
}

