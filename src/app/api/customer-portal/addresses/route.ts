import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/addresses
 * Get customer addresses (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Check if user is a customer and fetch their address
      const customer = await prisma.customer.findUnique({
        where: { id: user.id },
        select: { address: true }
      });

      // Address is stored as JSON, fallback to empty array
      let addresses: any[] = [];
      if (customer?.address) {
          addresses = Array.isArray(customer.address) ? customer.address : [customer.address];
      }

      logger.info({
        message: 'Customer addresses fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          count: addresses.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(addresses));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch addresses',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch addresses',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customer-portal/addresses
 * Create customer address (authenticated customer)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      
      const customer = await prisma.customer.findUnique({
        where: { id: user.id },
        select: { address: true }
      });

      if (!customer) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Customer not found' }, { status: 404 });
      }
      
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...body,
        createdAt: new Date().toISOString()
      };

      let currentAddresses: any[] = [];
      if (customer.address) {
          currentAddresses = Array.isArray(customer.address) ? customer.address : [customer.address];
      }
      
      await prisma.customer.update({
        where: { id: user.id },
        data: { address: [...currentAddresses, newAddress] as any }
      });

      const address = newAddress;

      logger.info({
        message: 'Address created',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          addressId: address.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(address), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create address',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create address',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);