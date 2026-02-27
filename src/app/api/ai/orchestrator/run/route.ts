import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, AuthenticatedRequest, getOrganizationScope } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/orchestrator/run
 * Manually trigger an AI Orchestrator cycle
 */
export const POST = requirePermission('MANAGE_AI')(
    async (req: AuthenticatedRequest, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                return NextResponse.json({ success: false, message: 'Org required' }, { status: 400 });
            }

            const result = await AIOrchestrator.runAutonomousCycle(organizationId, user.id);

            return NextResponse.json(successResponse(result));
        } catch (error: any) {
            return NextResponse.json({
                success: false,
                message: error.message || 'Orchestrator failed'
            }, { status: 500 });
        }
    }
);
