import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerEmail } = body;

    if (!customerEmail) {
      return NextResponse.json({ success: false, message: 'Customer email required' }, { status: 400 });
    }

    // Find customer
    const customer = await db.customer.findFirst({
      where: {
        email: customerEmail,
        organizationId: session.user.organizationId,
      },
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
          },
        },
        loyalty: true,
        wishlists: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // Create GDPR export data
    const exportData = {
      personalInfo: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      orders: customer.orders,
      loyalty: customer.loyalty,
      wishlists: customer.wishlists,
      exportedAt: new Date().toISOString(),
    };

    // Record the request
    await db.gDPRRequest.create({
      data: {
        organizationId: session.user.organizationId,
        customerId: customer.id,
        customerEmail,
        requestType: 'export',
        status: 'completed',
        completedAt: new Date(),
        completedBy: session.user.id,
        exportData: JSON.stringify(exportData),
      },
    });

    apiLogger.info('GDPR data export completed', { customerEmail });

    return NextResponse.json({
      success: true,
      data: exportData,
      message: 'Data exported successfully',
    });
  } catch (error) {
    apiLogger.error('Error exporting GDPR data', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to export data' }, { status: 500 });
  }
}

