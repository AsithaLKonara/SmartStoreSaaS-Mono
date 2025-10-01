import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function getReports(request: AuthRequest) {
  try {
    const organizationId = request.user!.organizationId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = { organizationId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get sales report
    if (type === 'sales' || type === 'all') {
      const salesData = await prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const salesSummary = {
        totalOrders: salesData.length,
        totalRevenue: salesData.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        averageOrderValue: salesData.length > 0 ? salesData.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / salesData.length : 0,
        orders: salesData
      };

      return NextResponse.json({
        success: true,
        data: {
          type: 'sales',
          summary: salesSummary,
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Get customer report
    if (type === 'customers' || type === 'all') {
      const customerData = await prisma.customer.findMany({
        where: whereClause,
        include: {
          orders: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true
            }
          }
        },
        take: 100
      });

      const customerSummary = {
        totalCustomers: customerData.length,
        activeCustomers: customerData.filter(c => c.isActive).length,
        customers: customerData.map(customer => ({
          ...customer,
          totalSpent: customer.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          orderCount: customer.orders.length
        }))
      };

      return NextResponse.json({
        success: true,
        data: {
          type: 'customers',
          summary: customerSummary,
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Get product report
    if (type === 'products' || type === 'all') {
      const productData = await prisma.product.findMany({
        where: { organizationId },
        include: {
          orderItems: {
            select: {
              quantity: true,
              price: true,
              order: {
                select: {
                  createdAt: true
                }
              }
            }
          }
        },
        take: 100
      });

      const productSummary = {
        totalProducts: productData.length,
        activeProducts: productData.filter(p => p.isActive).length,
        products: productData.map(product => ({
          ...product,
          totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
          totalRevenue: product.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }))
      };

      return NextResponse.json({
        success: true,
        data: {
          type: 'products',
          summary: productSummary,
          generatedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: 'all',
        message: 'All reports generated successfully',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateReport(request: AuthRequest) {
  try {
    const organizationId = request.user!.organizationId;
    const body = await request.json();
    const { type, startDate, endDate, format = 'json' } = body;

    const whereClause: any = { organizationId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    let reportData: any = {};

    switch (type) {
      case 'sales':
        const salesData = await prisma.order.findMany({
          where: whereClause,
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true
              }
            }
          }
        });

        reportData = {
          type: 'sales',
          totalOrders: salesData.length,
          totalRevenue: salesData.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          orders: salesData
        };
        break;

      case 'customers':
        const customerData = await prisma.customer.findMany({
          where: whereClause,
          include: {
            orders: true
          }
        });

        reportData = {
          type: 'customers',
          totalCustomers: customerData.length,
          customers: customerData
        };
        break;

      case 'products':
        const productData = await prisma.product.findMany({
          where: { organizationId },
          include: {
            orderItems: {
              include: {
                order: true
              }
            }
          }
        });

        reportData = {
          type: 'products',
          totalProducts: productData.length,
          products: productData
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    reportData.generatedAt = new Date().toISOString();
    reportData.generatedBy = request.user!.email;

    // Mock file generation for different formats
    if (format === 'csv') {
      // In a real implementation, you would generate CSV here
      reportData.format = 'csv';
      reportData.downloadUrl = `/api/reports/download/${Date.now()}.csv`;
    } else if (format === 'pdf') {
      // In a real implementation, you would generate PDF here
      reportData.format = 'pdf';
      reportData.downloadUrl = `/api/reports/download/${Date.now()}.pdf`;
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = createAuthHandler(getReports, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.REPORTS_READ],
});

export const POST = createAuthHandler(generateReport, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.REPORTS_WRITE],
});