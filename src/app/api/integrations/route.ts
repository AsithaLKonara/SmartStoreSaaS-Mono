export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: [], message: 'Integrations list (to be enhanced)' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching integrations' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, message: 'Integration creation (to be implemented)' }, { status: 501 });
}
