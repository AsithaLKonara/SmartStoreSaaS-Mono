import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { advancedWorkflowEngine } from '@/lib/workflows/advancedWorkflowEngine';
import { logger } from '@/lib/logger';
import { successResponse, errorResponse } from '@/lib/middleware/withErrorHandlerApp';

/**
 * Handle manual execution of AI workflows
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse('Unauthorized', 401), { status: 401 });
    }

    const body = await req.json();
    const { workflowId, triggerData } = body;

    if (!workflowId) {
      return NextResponse.json(errorResponse('workflowId is required', 400), { status: 400 });
    }

    // Resolve organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json(errorResponse('Organization not found', 404), { status: 404 });
    }

    logger.info({
      message: 'Manual workflow execution triggered',
      context: { userId: session.user.id, workflowId, organizationId: user.organizationId }
    });

    const execution = await advancedWorkflowEngine.executeWorkflow(workflowId, {
      ...triggerData,
      organizationId: user.organizationId,
      triggeredBy: session.user.id,
      triggeredAt: new Date().toISOString()
    });

    return NextResponse.json(successResponse({ 
      message: 'Workflow execution started', 
      executionId: execution.id 
    }));
  } catch (error) {
    logger.error({
      message: 'Failed to trigger workflow',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
