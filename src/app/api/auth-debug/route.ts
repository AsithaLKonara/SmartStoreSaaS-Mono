import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redisCache from '@/lib/cache/redis';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    const status: any = {
        env: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'PRESENT' : 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'PRESENT' : 'MISSING',
            DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT' : 'MISSING',
            UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'PRESENT' : 'MISSING',
        },
        database: 'PENDING',
        redis: 'PENDING',
        upstash: 'PENDING',
    };

    // Check Database
    try {
        await prisma.user.count();
        status.database = 'OK';
    } catch (err: any) {
        status.database = `FAIL: ${err.message}`;
    }

    // Check Redis (ioredis)
    try {
        const client = redisCache.client;
        if (client) {
            await client.ping();
            status.redis = 'OK';
        } else {
            status.redis = 'DISABLED (No config)';
        }
    } catch (err: any) {
        status.redis = `FAIL: ${err.message}`;
    }

    // Check Upstash (REST)
    try {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (url && token) {
            const upstash = new Redis({ url, token });
            await upstash.ping();
            status.upstash = 'OK';
        } else {
            status.upstash = 'MISSING_CONFIG';
        }
    } catch (err: any) {
        status.upstash = `FAIL: ${err.message}`;
    }

    return NextResponse.json(status);
}
