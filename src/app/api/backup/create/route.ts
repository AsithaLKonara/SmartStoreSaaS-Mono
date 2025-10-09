import { NextRequest, NextResponse } from 'next/server';
import { createBackup, exportBackupToJSON } from '@/lib/backup/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const backup = await createBackup(organizationId);
    const json = exportBackupToJSON(backup);

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${organizationId}-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Backup creation failed' },
      { status: 500 }
    );
  }
}

