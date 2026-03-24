import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, terminalId } = await req.json();

    // In a real application, integration with Stripe Terminal / Verifone happens here.
    logger.info(`Initiating card payment for $${amount} on terminal ${terminalId}`);

    return NextResponse.json({ 
      success: true, 
      clientSecret: 'pi_dummy_secret_for_terminal_integration',
      message: 'Payment intent created. Awaiting terminal swipe.'
    });
  } catch (error) {
    logger.error('Failed to init card payment', { error });
    return NextResponse.json({ error: 'Card Payment init failed' }, { status: 500 });
  }
}
