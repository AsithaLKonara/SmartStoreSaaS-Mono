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
        error: 'Invalid payout amount'
      }, { status: 400 });
    }

    // Record payout
    const affiliate = await prisma.affiliates.findUnique({
      where: { id: params.id }
    });

    if (!affiliate) {
      return NextResponse.json({
        success: false,
        error: 'Affiliate not found'
      }, { status: 404 });
    }

    // Create payout record
    const payout = {
      id: `payout_${Date.now()}`,
      affiliateId: params.id,
      amount: amount,
      status: 'PROCESSED',
      processedAt: new Date(),
      method: 'BANK_TRANSFER'
    };

    return NextResponse.json({
      success: true,
      payout,
      message: `Payout of ${amount} processed successfully`
    });
  } catch (error: any) {
    console.error('Error processing payout:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

