import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, AuthenticatedRequest, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/chat
 * Chat with the AI Store Manager
 */
export const POST = requirePermission('MANAGE_AI')(
    async (req: AuthenticatedRequest, user) => {
        try {
            const { query } = await req.json();

            if (!query) {
                throw new ValidationError('Query is required');
            }

            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                return NextResponse.json({ success: false, message: 'Org required' }, { status: 400 });
            }

            const result = await AIOrchestrator.handleChatQuery(organizationId, user.id, query);

            return NextResponse.json(successResponse(result));
        } catch (error: any) {
            if (error instanceof ValidationError) throw error;

            return NextResponse.json({
                success: false,
                message: error.message || 'Chat failed'
            }, { status: 500 });
        }
    }
);
