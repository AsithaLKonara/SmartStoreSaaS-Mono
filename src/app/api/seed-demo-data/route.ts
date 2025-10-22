import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API endpoint under development',
    status: 'coming_soon'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API endpoint under development',
    status: 'coming_soon'
  });
}
