import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Generate shipping label (mock for now)
    const labelUrl = `/shipping/labels/${params.id}.pdf`;

    return NextResponse.json({
      success: true,
      labelUrl,
      message: 'Shipping label generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating label:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

