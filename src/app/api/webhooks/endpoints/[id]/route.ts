/**
 * Single Webhook Endpoint API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOKS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WEBHOOKS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WEBHOOKS permission)
 * 
 * Organization Scoping: Validated through webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const webhookId = params.id;

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new ValidationError('Webhook not found');
      }

      if (webhook.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view webhooks from other organizations');
      }

      logger.info({
        message: 'Webhook fetched',
        context: { userId: user.id, webhookId }
      });

      return NextResponse.json(successResponse(webhook));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const webhookId = params.id;
      const body = await request.json();

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new ValidationError('Webhook not found');
      }

      if (webhook.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update webhooks from other organizations');
      }

      const updated = await prisma.webhook.update({
        where: { id: webhookId },
        data: body
      });

      logger.info({
        message: 'Webhook updated',
        context: { userId: user.id, webhookId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update webhook',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const webhookId = params.id;

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new ValidationError('Webhook not found');
      }

      if (webhook.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete webhooks from other organizations');
      }

      await prisma.webhook.delete({
        where: { id: webhookId }
      });

      logger.info({
        message: 'Webhook deleted',
        context: { userId: user.id, webhookId }
      });

      return NextResponse.json(successResponse({
        message: 'Webhook deleted',
        webhookId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete webhook',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

