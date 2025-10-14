/**
 * Journal Entries API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      // Only accountant staff can access
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view journal entries');
      }

      const orgId = getOrganizationScope(user);

      const entries = await prisma.journal_entries.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { entryDate: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Journal entries fetched',
        context: { userId: user.id, count: entries.length }
      });

      return NextResponse.json(successResponse(entries));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch journal entries',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can create journal entries');
      }

      const body = await request.json();
      const { description, entryDate, lines } = body;

      if (!description || !lines || lines.length === 0) {
        throw new ValidationError('Description and lines are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const entry = await prisma.journal_entries.create({
        data: {
          organizationId,
          entryNumber: `JE-${Date.now()}`,
          description,
          entryDate: entryDate ? new Date(entryDate) : new Date(),
          status: 'DRAFT',
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Journal entry created',
        context: { userId: user.id, entryId: entry.id }
      });

      return NextResponse.json(successResponse(entry), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create journal entry',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
