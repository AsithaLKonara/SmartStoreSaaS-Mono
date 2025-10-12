import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const review = await prisma.reviews.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        moderatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving review:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

