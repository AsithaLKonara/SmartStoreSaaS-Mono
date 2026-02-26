import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache/redis';
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
        const count = await prisma.user.count();
        status.database = `OK (count: ${count})`;
    } catch (err: any) {
        status.database = `FAIL: ${err.message}`;
    }

    // Check Redis (ioredis)
    try {
        const client = getRedisClient();
        if (client) {
            const ping = await client.ping();
            status.redis = `OK (${ping})`;
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
            const ping = await upstash.ping();
            status.upstash = `OK (${ping})`;
        } else {
            status.upstash = 'MISSING_CONFIG';
        }
    } catch (err: any) {
        status.upstash = `FAIL: ${err.message}`;
    }

    return NextResponse.json(status);
}
