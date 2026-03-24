import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });
    }

    const { groupedCart, customerId } = await req.json();

    // 1. Calculate total checkout amount for the customer
    let totalAmount = 0;
    for (const group of groupedCart) {
      totalAmount += Number(group.subtotal);
    }

    const transferGroup = `GRP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 2. Create the master PaymentIntent using transfer_group 
    // This intent happens on the PLATFORM account.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in cents
      currency: 'usd',
      transfer_group: transferGroup,
      metadata: { 
        source: 'Global_Marketplace_Checkout',
        customer_id: customerId || session.user.id
      }
    });

    // 3. Create the OrderGroup in the database to track this transaction
    const orderGroup = await prisma.orderGroup.create({
      data: {
        customerId: customerId || (session.user as any).id, // Fallback to session user id if no customer mapping
        totalAmount: totalAmount,
        transferGroup: transferGroup,
        stripeSessionId: paymentIntent.id, // Storing the PaymentIntent ID here
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      transferGroup,
      orderGroupId: orderGroup.id
    });

  } catch (error) {
    logger.error('Marketplace master payment intent failed:', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to initialize marketplace payment pool' },
      { status: 500 }
    );
  }
}
