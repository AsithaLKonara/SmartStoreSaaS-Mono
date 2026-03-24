import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const organizationId = session.user.organizationId as string;

    if (!query) {
      return NextResponse.json({ data: [] });
    }

    const customers = await prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 10,
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    logger.error('Error searching customers', { error });
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 });
  }
}
