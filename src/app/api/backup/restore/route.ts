import { NextRequest, NextResponse } from 'next/server';
import { restoreBackup, importBackupFromJSON } from '@/lib/backup/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backupData, clearExisting = false, skipUsers = true } = body;

    if (!backupData) {
      return NextResponse.json(
        { error: 'Backup data is required' },
        { status: 400 }
      );
    }

    // Parse if string
    const backup = typeof backupData === 'string' 
      ? importBackupFromJSON(backupData) 
      : backupData;

    const result = await restoreBackup(backup, { clearExisting, skipUsers });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Backup restored successfully',
        restored: result.restored,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Backup restored with errors',
        restored: result.restored,
        errors: result.errors,
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch (error: any) {
    console.error('Backup restore error:', error);
    return NextResponse.json(
      { error: error.message || 'Backup restore failed' },
      { status: 500 }
    );
  }
}

