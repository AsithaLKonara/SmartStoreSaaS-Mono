import { NextRequest, NextResponse } from 'next/server';
import { createAPIKey, listAPIKeys, revokeAPIKey } from '@/lib/api-keys/manager';

export const dynamic = 'force-dynamic';

// List API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const apiKeys = await listAPIKeys(organizationId);

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error: any) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

// Create API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, organizationId, userId, permissions, expiresAt } = body;

    if (!name || !organizationId || !userId) {
      return NextResponse.json(
        { error: 'Name, organization ID, and user ID are required' },
        { status: 400 }
      );
    }

    const { key, keyData } = await createAPIKey({
      name,
      organizationId,
      userId,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({
      success: true,
      key, // Return the plain key only once!
      data: {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions,
        expiresAt: keyData.expiresAt,
        createdAt: keyData.createdAt,
      },
      warning: 'Save this key securely. It will not be shown again.',
    });
  } catch (error: any) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    const success = await revokeAPIKey(keyId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}

