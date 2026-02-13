import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, AuthenticatedRequest, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { FinancialService } from '@/lib/services/financial.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/financial/audit
 * Trigger a manual financial audit
 */
export const POST = requirePermission('MANAGE_AI')(
    async (req: AuthenticatedRequest, user) => {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
            return NextResponse.json({ success: false, message: 'Org required' }, { status: 400 });
        }

        try {
            const report = await AIOrchestrator.runFinancialAudit(organizationId);
            return NextResponse.json(successResponse(report));
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);

/**
 * GET /api/ai/financial/audit
 * Get the latest financial report
 */
export const GET = requirePermission('VIEW_ANALYTICS')(
    async (req: AuthenticatedRequest, user) => {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
            return NextResponse.json({ success: false, message: 'Org required' }, { status: 400 });
        }

        try {
            const report = await FinancialService.getLatestReport(organizationId);
            return NextResponse.json(successResponse(report));
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
