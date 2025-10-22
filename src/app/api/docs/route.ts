import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    logger.info({
      message: 'Documents fetched',
      context: { userId: session.user.id }
    });

    // TODO: Implement documents fetching
    // This would typically involve querying documents from database
    const documents = [
      {
        id: 'doc_1',
        title: 'Getting Started Guide',
        description: 'A comprehensive guide to get started with the platform',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'doc_2',
        title: 'API Documentation',
        description: 'Complete API reference and examples',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch documents',
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch documents',
      details: error.message
    }, { status: 500 });
  }
}