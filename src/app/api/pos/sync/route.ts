import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: {"type": "CONNECTED"}\n\n`));
      
      // In a real application, you would attach listeners to your
      // pub/sub redis, database events, or event emitter.
      // For this minimal patch, we simulate periodic pings
      const interval = setInterval(() => {
        // We'd push real updates like { type: 'INVENTORY_UPDATE', productId: '...' }
        controller.enqueue(encoder.encode(`data: {"type": "PING", "timestamp": "${new Date().toISOString()}"}\n\n`));
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
