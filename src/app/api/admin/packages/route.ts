import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const GET = requireRole(['SUPER_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      // In a real system, we'd have a 'Package' or 'Plan' model.
      // If missing, we simulate based on Organization Plan types or a default set.
      const organizations = await prisma.organization.findMany({
        select: {
          plan: true,
          createdAt: true
        }
      });

      // Aggregate subscriber counts by plan type
      const planStats = organizations.reduce((acc: any, org) => {
        acc[org.plan] = (acc[org.plan] || 0) + 1;
        return acc;
      }, {});

      // Base definitions for our dynamic packages
      const packagesData = [
        {
          id: 'FREE',
          name: 'Free Starter',
          description: 'Basic features for small stores.',
          price: 0,
          currency: 'USD',
          duration: 30,
          features: ['100 Products', 'Basic Stats', '1 Warehouse'],
          status: 'ACTIVE',
          subscribers: planStats['FREE'] || 0
        },
        {
          id: 'PRO',
          name: 'Professional',
          description: 'Advanced tools for growing businesses.',
          price: 49.99,
          currency: 'USD',
          duration: 30,
          features: ['Unlimited Products', 'AI Assistant', 'Multi-Warehouse', 'Priority Support'],
          status: 'ACTIVE',
          subscribers: (planStats['PRO'] || 0) + (planStats['PROFESSIONAL'] || 0)
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise',
          description: 'Custom solutions for large scale operations.',
          price: 199.99,
          currency: 'USD',
          duration: 30,
          features: ['Custom SLA', 'Dedicated Manager', 'Custom Integrations', 'White Label'],
          status: 'ACTIVE',
          subscribers: planStats['ENTERPRISE'] || 0
        }
      ];

      return NextResponse.json({
        success: true,
        data: packagesData.map(p => ({
          ...p,
          createdAt: new Date().toISOString(), // Mocking creation date if no model exists yet
          updatedAt: new Date().toISOString()
        }))
      });

    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch packages',
        error: error.message
      });
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  }
);
