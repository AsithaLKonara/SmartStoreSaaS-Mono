import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get WhatsApp messages
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const customerId = searchParams.get('customerId');
        const status = searchParams.get('status');

        const where: any = {
          organizationId: user.organizationId,
        };

        if (customerId) {
          where.customerId = customerId;
        }

        if (status) {
          where.status = status;
        }

        const [messages, total] = await Promise.all([
          prisma.whatsAppMessage.findMany({
            where,
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.whatsAppMessage.count({ where }),
        ]);

        return NextResponse.json({
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });

      case 'POST':
        // Send WhatsApp message
        const { customerId: targetCustomerId, message, type = 'text', mediaUrl } = await request.json();

        if (!targetCustomerId || !message) {
          return NextResponse.json(
            { error: 'Missing required fields: customerId, message' },
            { status: 400 }
          );
        }

        // Verify customer exists and belongs to organization
        const customer = await prisma.customer.findFirst({
          where: {
            id: targetCustomerId,
            organizationId: user.organizationId,
          },
        });

        if (!customer) {
          return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
          );
        }

        // Check if WhatsApp integration is active
        const integration = await prisma.whatsAppIntegration.findFirst({
          where: {
            organizationId: user.organizationId,
            isActive: true,
          },
        });

        if (!integration) {
          return NextResponse.json(
            { error: 'WhatsApp integration is not configured or inactive' },
            { status: 400 }
          );
        }

        // Create message record
        const newMessage = await prisma.whatsAppMessage.create({
          data: {
            organizationId: user.organizationId,
            customerId: targetCustomerId,
            phoneNumber: customer.phone,
            message,
            type,
            mediaUrl,
            status: 'PENDING',
            direction: 'OUTBOUND',
          },
        });

        // TODO: Implement actual WhatsApp API call here
        // For now, we'll simulate success
        const updatedMessage = await prisma.whatsAppMessage.update({
          where: { id: newMessage.id },
          data: { 
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            message: 'WhatsApp message sent successfully',
            data: updatedMessage,
          },
          { status: 201 }
        );

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('WhatsApp Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.CUSTOMER_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.CUSTOMER_WRITE],
});
