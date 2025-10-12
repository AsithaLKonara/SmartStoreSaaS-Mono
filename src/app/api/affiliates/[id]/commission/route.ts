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

    // Mock commission history
    const commissions = [
      {
        id: 'comm_001',
        orderId: 'ord_123',
        orderNumber: 'ORD-2024-001',
        saleAmount: 5000,
        commissionRate: 10,
        commissionAmount: 500,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    const summary = {
      totalEarned: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      paid: commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0),
      pending: commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0)
    };

    return NextResponse.json({
      success: true,
      commissions,
      summary
    });
  } catch (error: any) {
    console.error('Error fetching commission history:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

