import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Mock affiliate sales history
    const sales = [
      {
        id: 'sale_001',
        orderId: 'ord_123',
        orderNumber: 'ORD-2024-001',
        customerName: 'John Doe',
        amount: 5000,
        commission: 500,
        commissionRate: 10,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      sales,
      total: sales.length
    });
  } catch (error: any) {
    console.error('Error fetching affiliate sales:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

