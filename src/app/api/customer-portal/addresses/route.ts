/**
 * Customer Portal Addresses API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own addresses)
 * - POST: CUSTOMER only (add new address)
 * 
 * Customer Scoping: User sees only their own addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      const addresses = await prisma.address.findMany({
        where: { customerId: customer.id },
        orderBy: { isDefault: 'desc' }
      });

      logger.info({
        message: 'Customer addresses fetched',
        context: { userId: user.id, count: addresses.length }
      });

      return NextResponse.json(successResponse(addresses));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch addresses',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { street, city, state, postalCode, country, isDefault } = body;

      if (!street || !city || !country) {
        throw new ValidationError('Street, city, and country are required');
      }

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      const address = await prisma.address.create({
        data: {
          customerId: customer.id,
          street,
          city,
          state,
          postalCode,
          country,
          isDefault: isDefault || false
        }
      });

      logger.info({
        message: 'Customer address created',
        context: { userId: user.id, addressId: address.id }
      });

      return NextResponse.json(successResponse(address), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create address',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
