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
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/journal-entries
 * List journal entries with organization scoping
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Additional check for STAFF role - must be accountant
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Only accountant staff can view journal entries',
          correlation: req.correlationId || 'unknown'
        }, { status: 403 });
      }

      // Get organization scoping
      const orgId = getOrganizationScope(user);

      const entries = await prisma.journal_entries.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { entryDate: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Journal entries fetched',
        context: {
          userId: user.id,
          count: entries.length,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(entries));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch journal entries',
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
        message: 'Failed to fetch journal entries',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/accounting/journal-entries
 * Create journal entry with organization scoping
 */
export const POST = requirePermission('MANAGE_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Additional check for STAFF role - must be accountant
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        return NextResponse.json({
          success: false,
          code: 'ERR_FORBIDDEN',
          message: 'Only accountant staff can create journal entries',
          correlation: req.correlationId || 'unknown'
        }, { status: 403 });
      }

      const body = await req.json();
      const { description, entryDate, lines } = body;

      // Validation
      if (!description || !lines || lines.length === 0) {
        throw new ValidationError('Description and lines are required', {
          fields: { description: !description, lines: !lines || lines.length === 0 }
        });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const entry = await prisma.journal_entries.create({
        data: {
          id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          entryNumber: `JE-${Date.now()}`,
          description,
          entryDate: entryDate ? new Date(entryDate) : new Date(),
          status: 'DRAFT',
          createdBy: user.id,
          updatedAt: new Date()
        }
      });

      logger.info({
        message: 'Journal entry created',
        context: {
          userId: user.id,
          entryId: entry.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(entry), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create journal entry',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create journal entry',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
