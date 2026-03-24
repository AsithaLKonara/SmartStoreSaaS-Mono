import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { verifyMfaCode } from '@/lib/auth/mfa';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'MFA code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { mfaSecret: true, mfaBackupCodes: true }
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA not enabled for this user' }, { status: 400 });
    }

    // Check TOTP code
    const isValid = verifyMfaCode(user.mfaSecret, code);

    // If not valid, check backup codes
    if (!isValid && user.mfaBackupCodes) {
      const backupCodes = JSON.parse(user.mfaBackupCodes) as string[];
      const backupIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (backupIndex !== -1) {
        // Use backup code and remove it
        backupCodes.splice(backupIndex, 1);
        await prisma.user.update({
          where: { id: token.id as string },
          data: { mfaBackupCodes: JSON.stringify(backupCodes) }
        });
        
        logger.info({
          message: 'MFA: Backup code used',
          context: { userId: token.id }
        });
        
        return NextResponse.json({ success: true });
      }
    }

    if (!isValid) {
      logger.warn({
        message: 'MFA: Invalid code attempt',
        context: { userId: token.id }
      });
      return NextResponse.json({ error: 'Invalid MFA code' }, { status: 400 });
    }

    logger.info({
      message: 'MFA: Verification successful',
      context: { userId: token.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({
      message: 'MFA: Verification error',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
