import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// POST /api/tenants/switch - Switch tenant (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // @ts-ignore
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only Super Admin can switch tenants' }, { status: 403 });
    }
    
    const body = await request.json();
    const { tenantId } = body;
    
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }
    
    // Update session to include new tenant context
    // Note: In production, you'd update the JWT token or use a server-side session store
    
    return NextResponse.json({
      success: true,
      message: 'Tenant switched successfully',
      tenantId
    });
  } catch (error) {
    console.error('Tenant switch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to switch tenant' },
      { status: 500 }
    );
  }
}

