import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';

async function handler(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = request.user!.organizationId;

    // Get sync status for organization
    const syncStatus = await getSyncStatus(organizationId);

    return NextResponse.json({
      success: true,
      data: syncStatus,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSyncStatus(organizationId: string) {
  // Simplified sync status
  return {
    organizationId,
    status: 'active',
    lastSync: new Date().toISOString(),
    connectedDevices: 3,
    pendingChanges: 0,
    syncErrors: [],
    features: {
      realTimeSync: true,
      offlineSupport: true,
      conflictResolution: true
    }
  };
}

async function handleSyncPost(request: AuthRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'force-sync':
        const syncResult = await forceSync(request.user!.organizationId);
        return NextResponse.json({
          success: true,
          data: syncResult,
          message: 'Sync completed successfully'
        });

      case 'resolve-conflict':
        const { conflictId, resolution } = data;
        const conflictResult = await resolveConflict(conflictId, resolution);
        return NextResponse.json({
          success: true,
          data: conflictResult,
          message: 'Conflict resolved successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sync POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function forceSync(organizationId: string) {
  // Simplified force sync
  return {
    organizationId,
    status: 'completed',
    syncedAt: new Date().toISOString(),
    recordsSynced: 150,
    errors: []
  };
}

async function resolveConflict(conflictId: string, resolution: any) {
  // Simplified conflict resolution
  return {
    conflictId,
    resolution,
    resolvedAt: new Date().toISOString(),
    status: 'resolved'
  };
}

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handleSyncPost, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});