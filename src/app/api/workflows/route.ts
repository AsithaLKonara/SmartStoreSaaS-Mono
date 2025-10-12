import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkflowTemplates } from '@/lib/automation/workflow';

export const dynamic = 'force-dynamic';

// List workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const workflows = await prisma.workflow.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: workflows,
      templates: WorkflowTemplates,
    });
  } catch (error: any) {
    console.error('List workflows error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

// Create workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, trigger, conditions, actions, organizationId, isActive = true } = body;

    if (!name || !trigger || !actions || !organizationId) {
      return NextResponse.json(
        { error: 'Name, trigger, actions, and organization ID are required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        trigger,
        conditions: conditions || [],
        actions,
        organizationId,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
    });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

// Update workflow
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully',
    });
  } catch (error: any) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}

