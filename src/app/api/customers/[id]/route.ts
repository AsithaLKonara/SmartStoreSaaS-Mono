/**
 * Single Customer API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_CUSTOMERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { withErrorHandlerApp } from '@/lib/middleware/withErrorHandlerApp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN, STAFF
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const customerId = params.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add organization scoping check
    if (customer.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot view customers from other organizations' }, { status: 403 });
    }

    logger.info({
      message: 'Customer fetched',
      context: { userId: session.user.id, customerId }
    });

    return NextResponse.json(successResponse(customer));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch customer',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const customerId = params.id;
    const body = await request.json();

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add organization scoping check
    if (customer.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot update customers from other organizations' }, { status: 403 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: body
    });

    logger.info({
      message: 'Customer updated',
      context: { userId: session.user.id, customerId }
    });

    return NextResponse.json(successResponse(updated));
  } catch (error: any) {
    logger.error({
      message: 'Failed to update customer',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const customerId = params.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // TODO: Add organization scoping check
    if (customer.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot delete customers from other organizations' }, { status: 403 });
    }

    await prisma.customer.delete({
      where: { id: customerId }
    });

    logger.info({
      message: 'Customer deleted',
      context: { userId: session.user.id, customerId }
    });

    return NextResponse.json(successResponse({
      message: 'Customer deleted',
      customerId
    }));
  } catch (error: any) {
    logger.error({
      message: 'Failed to delete customer',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
