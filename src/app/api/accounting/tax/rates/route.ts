import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List tax rates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const taxRates = await db.taxRate.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: taxRates,
      count: taxRates.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching tax rates', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch tax rates' }, { status: 500 });
  }
}

// POST - Create tax rate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, rate, jurisdiction, taxType, isCompound, description } = body;

    if (!name || !code || !rate || !taxType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, code, rate, taxType' },
        { status: 400 }
      );
    }

    const taxRate = await db.taxRate.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        code,
        rate: parseFloat(rate),
        jurisdiction,
        taxType,
        isCompound: isCompound || false,
        description,
      },
    });

    apiLogger.info('Tax rate created', { taxRateId: taxRate.id, code, rate });

    return NextResponse.json({
      success: true,
      data: taxRate,
    });
  } catch (error) {
    apiLogger.error('Error creating tax rate', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create tax rate' }, { status: 500 });
  }
}

