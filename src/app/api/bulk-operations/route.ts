import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Bulk operation schema
const bulkOperationSchema = z.object({
  type: z.enum(['PRODUCT_UPDATE', 'PRODUCT_DELETE', 'CUSTOMER_UPDATE', 'ORDER_STATUS_UPDATE', 'INVENTORY_UPDATE']),
  items: z.array(z.record(z.any())).min(1, 'At least one item is required'),
  filters: z.record(z.any()).optional(),
  settings: z.object({
    dryRun: z.boolean().default(false),
    batchSize: z.number().min(1).max(1000).default(100),
    notifyOnComplete: z.boolean().default(true)
  }).optional()
});

// GET /api/bulk-operations - List bulk operations with pagination
async function getBulkOperations(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      organizationId: request.user!.organizationId
    };
    
    if (type) where.type = type;
    if (status) where.status = status;

    // Get total count for pagination
    const total = await prisma.bulkOperation.count({ where });
    
    // Get bulk operations with pagination
    const operations = await prisma.bulkOperation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        // createdBy include removed - not in schema
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        operations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching bulk operations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch bulk operations' },
      { status: 500 }
    );
  }
}

// POST /api/bulk-operations - Create new bulk operation
async function createBulkOperation(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = bulkOperationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const operationData = validationResult.data;
    const settings = operationData.settings || { dryRun: false, batchSize: 100, notifyOnComplete: true };

    // Create bulk operation record
    const operation = await prisma.bulkOperation.create({
      data: {
        type: operationData.type,
        entity: operationData.type.split('_')[0].toLowerCase() + 's', // Extract entity from type
        status: 'PENDING',
        totalRecords: operationData.items.length,
        processedRecords: 0,
        successRecords: 0,
        failedRecords: 0,
        // settings field removed - not in schema
        metadata: {
          filters: operationData.filters,
          itemCount: operationData.items.length
        },
        organization: {
          connect: { id: request.user!.organizationId }
        }
      }
    });

    // Process bulk operation asynchronously
    processBulkOperation(operation, operationData, settings);

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'BULK_OPERATION_CREATED',
        description: `Bulk operation "${operationData.type}" created with ${operationData.items.length} items`,
        userId: request.user!.userId,
        metadata: {
          operationId: operation.id,
          operationType: operationData.type,
          itemCount: operationData.items.length,
          dryRun: settings.dryRun
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { operation },
      message: 'Bulk operation created successfully'
    }, { status: 202 });

  } catch (error) {
    console.error('Error creating bulk operation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create bulk operation' },
      { status: 500 }
    );
  }
}

// Process bulk operation asynchronously
async function processBulkOperation(operation: any, operationData: any, settings: any) {
  try {
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];
    const failedItems: any[] = [];

    // Update status to processing
    await prisma.bulkOperation.update({
      where: { id: operation.id },
      data: { status: 'PROCESSING' }
    });

    // Process items in batches
    for (let i = 0; i < operationData.items.length; i += settings.batchSize) {
      const batch = operationData.items.slice(i, i + settings.batchSize);
      
      for (const item of batch) {
        try {
          if (!settings.dryRun) {
            await processBulkItem(operation.type, item);
          }
          successful++;
        } catch (error) {
          console.error('Error processing item:', item, error);
          failed++;
          failedItems.push({
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errors.push({
            item,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        processed++;
      }

      // Update progress
      await prisma.bulkOperation.update({
        where: { id: operation.id },
        data: {
          processedRecords: processed,
          successRecords: successful,
          failedRecords: failed
        }
      });

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update final status
    const finalStatus = failed === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
    await prisma.bulkOperation.update({
      where: { id: operation.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        metadata: {
          ...operation.metadata,
          errors: errors.slice(0, 10) // Store first 10 errors
        }
      }
    });

  } catch (error) {
    console.error('Error processing bulk operation:', error);
    await prisma.bulkOperation.update({
      where: { id: operation.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        metadata: {
          ...operation.metadata,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });
  }
}

// Process individual bulk operation item
async function processBulkItem(type: string, item: any) {
  switch (type) {
    case 'PRODUCT_UPDATE':
      await prisma.product.update({
        where: { id: item.id },
        data: item.updates
      });
      break;
    case 'PRODUCT_DELETE':
      await prisma.product.delete({
        where: { id: item.id }
      });
      break;
    case 'CUSTOMER_UPDATE':
      await prisma.customer.update({
        where: { id: item.id },
        data: item.updates
      });
      break;
    case 'ORDER_STATUS_UPDATE':
      await prisma.order.update({
        where: { id: item.id },
        data: { status: item.status }
      });
      break;
    case 'INVENTORY_UPDATE':
      // Inventory update removed - model doesn't exist
      break;
    default:
      throw new Error(`Unknown bulk operation type: ${type}`);
  }
}

// Export handlers
export const GET = withProtection()(getBulkOperations);
export const POST = withProtection(['ADMIN', 'MANAGER'])(createBulkOperation); 