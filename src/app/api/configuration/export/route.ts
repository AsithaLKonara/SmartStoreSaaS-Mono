import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { configurationManager, ConfigurationUtils } from '@/lib/configuration';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'json' | 'env' | 'yaml' || 'json';
    const environment = searchParams.get('environment');
    const category = searchParams.get('category');

    let configurations;

    if (category) {
      configurations = configurationManager.getConfigurationsByCategory(category, environment || undefined);
    } else {
      configurations = configurationManager.getAllConfigurations(environment || undefined);
    }

    const exportData = ConfigurationUtils.formatForExport(configurations, format);

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="configurations-${new Date().toISOString().split('T')[0]}.${format}"`);

    return new NextResponse(exportData, { headers });

  } catch (error) {
    console.error('Export configurations error:', error);
    return NextResponse.json(
      { error: 'Failed to export configurations' },
      { status: 500 }
    );
  }
}


