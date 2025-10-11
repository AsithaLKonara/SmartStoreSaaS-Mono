import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

const handleWebVitals = async (request: NextRequest) => {
  try {
    const vital = await request.json();
    
    // Track the web vital
    performanceMonitor.trackWebVitals(vital);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to track web vital:', error);
    return NextResponse.json(
      { error: 'Failed to track web vital' },
      { status: 500 }
    );
  }
};

export const POST = withErrorHandling(handleWebVitals);


