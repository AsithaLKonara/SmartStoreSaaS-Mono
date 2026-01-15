import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AIRecommendationEngine } from '@/lib/ai/recommendationEngine';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId') || session.user.organizationId;
        const limit = parseInt(searchParams.get('limit') || '10');

        const engine = new AIRecommendationEngine();
        const trending = await engine.getTrendingProducts(organizationId, limit);

        return NextResponse.json({
            success: true,
            trending,
            count: trending.length
        });
    } catch (error) {
        logger.error({
            message: 'Error fetching trending products',
            error: error instanceof Error ? error : new Error(String(error)),
            context: { service: 'TrendingAPI', operation: 'GET' }
        });

        return NextResponse.json(
            { error: 'Failed to get trending products' },
            { status: 500 }
        );
    }
}
