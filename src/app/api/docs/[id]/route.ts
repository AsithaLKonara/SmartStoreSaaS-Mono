/**
 * Single Documentation API Route
 * 
 * Authorization:
 * - GET: Requires authentication (all roles can view docs)
 * 
 * Provides access to specific documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const docId = params.id;

      logger.info({
        message: 'Documentation page accessed',
        context: { userId: user.id, docId }
      });

      // TODO: Fetch actual documentation
      return NextResponse.json(successResponse({
        id: docId,
        title: 'Documentation',
        content: '',
        message: 'Documentation - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch documentation',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
