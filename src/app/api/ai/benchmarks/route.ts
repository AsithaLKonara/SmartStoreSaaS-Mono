import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { AggregatedAnalyticsService } from '@/lib/services/aggregated-analytics.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/benchmarks
 * Global benchmarking for the organization
 */
export const GET = requirePermission(Permission.ANALYTICS_READ)(
    async (req: AuthenticatedRequest, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                throw new ValidationError('Organization scope required');
            }

            const benchmark = await AggregatedAnalyticsService.getBenchmark(organizationId);

            return NextResponse.json(successResponse(benchmark));
        } catch (error: any) {
            return NextResponse.json({
                success: false,
                message: error.message || 'Failed to fetch benchmarks'
            }, { status: 500 });
        }
    }
);
