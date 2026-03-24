import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { generateMfaSecret } from '@/lib/auth/mfa';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { email: true, mfaEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.mfaEnabled) {
      // Allow re-setup if they want to reset it, but maybe security confirm first
      // For now, let's just proceed or require current password
    }

    const { secret, qrCodeUrl } = await generateMfaSecret(token.id as string, user.email);

    logger.info({
      message: 'MFA Setup: Secret generated',
      context: { userId: token.id }
    });

    return NextResponse.json({ secret, qrCodeUrl });
  } catch (error) {
    logger.error({
      message: 'MFA Setup: Error generating secret',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
