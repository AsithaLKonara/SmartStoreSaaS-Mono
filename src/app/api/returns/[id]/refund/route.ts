import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid refund amount'
      }, { status: 400 });
    }

    // Update return status to REFUNDED
    const returnRequest = await prisma.returns.update({
      where: { id: params.id },
      data: {
        status: 'REFUNDED',
        refundAmount: amount,
        refundedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      return: returnRequest,
      message: 'Refund processed successfully'
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

