import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const docId = params.id;

    logger.info({
      message: 'Document fetched',
      context: { userId: session.user.id, docId }
    });

    // TODO: Implement document fetching
    // This would typically involve querying documents from database
    const document = {
      id: docId,
      title: 'Sample Document',
      content: 'This is a sample document content.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch document',
      error: error.message,
      context: { docId: params.id }
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch document',
      details: error.message
    }, { status: 500 });
  }
}