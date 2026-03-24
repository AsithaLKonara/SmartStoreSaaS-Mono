import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { verifyMfaCode, enableMfa, generateBackupCodes } from '@/lib/auth/mfa';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, code } = await req.json();

    if (!secret || !code) {
      return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 });
    }

    // Verify the code first
    const isValid = verifyMfaCode(secret, code);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable MFA in DB
    await enableMfa(token.id as string, secret, backupCodes);

    logger.info({
      message: 'MFA Setup: MFA enabled for user',
      context: { userId: token.id }
    });

    return NextResponse.json({ 
      success: true, 
      backupCodes 
    });
  } catch (error) {
    logger.error({
      message: 'MFA Setup: Error enabling MFA',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
