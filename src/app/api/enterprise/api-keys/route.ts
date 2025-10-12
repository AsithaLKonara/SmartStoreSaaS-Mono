export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

// GET - List API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await db.aPIKey.findMany({
      where: { organizationId: session.user.organizationId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: apiKeys });
  } catch (error) {
    apiLogger.error('Error fetching API keys', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST - Create API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions, rateLimit, expiresAt } = body;

    // Generate API key and secret
    const key = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const secret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const apiKey = await db.aPIKey.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        key,
        secretHash,
        permissions: JSON.stringify(permissions),
        rateLimit: rateLimit || 1000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    apiLogger.info('API key created', { apiKeyId: apiKey.id });

    return NextResponse.json({
      success: true,
      data: {
        ...apiKey,
        secret, // Return secret only once
      },
    });
  } catch (error) {
    apiLogger.error('Error creating API key', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create API key' }, { status: 500 });
  }
}

