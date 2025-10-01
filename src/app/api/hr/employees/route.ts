export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List employees
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const employees = await db.employee.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            attendance: true,
            commissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    apiLogger.error('Error fetching employees', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST - Create employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, position, department, hireDate, salary, commissionRate } = body;

    // Generate employee code
    const count = await db.employee.count({
      where: { organizationId: session.user.organizationId },
    });
    const employeeCode = `EMP-${(count + 1).toString().padStart(5, '0')}`;

    const employee = await db.employee.create({
      data: {
        organizationId: session.user.organizationId,
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        hireDate: new Date(hireDate),
        salary: salary ? parseFloat(salary) : null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
      },
    });

    apiLogger.info('Employee created', { employeeId: employee.id, employeeCode });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    apiLogger.error('Error creating employee', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create employee' }, { status: 500 });
  }
}

