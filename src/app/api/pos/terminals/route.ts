/**
 * POS Terminals API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_POS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_POS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const terminals = await prisma.posTerminal.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { name: 'asc' }
      });

      logger.info({
        message: 'POS terminals fetched',
        context: { userId: user.id, count: terminals.length }
      });

      return NextResponse.json(successResponse(terminals));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch POS terminals',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { name, location, type } = body;

      if (!name) {
        throw new ValidationError('Terminal name is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const terminal = await prisma.posTerminal.create({
        data: {
          organizationId,
          name,
          location,
          type: type || 'STANDARD',
          isActive: true
        }
      });

      logger.info({
        message: 'POS terminal created',
        context: { userId: user.id, terminalId: terminal.id }
      });

      return NextResponse.json(successResponse(terminal), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create POS terminal',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

