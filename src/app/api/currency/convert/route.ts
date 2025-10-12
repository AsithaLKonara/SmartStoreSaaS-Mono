import { NextRequest, NextResponse } from 'next/server';
import {
  convertCurrency,
  formatCurrency,
  getSupportedCurrencies,
  batchConvert,
} from '@/lib/currency/converter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'convert';

    if (action === 'list') {
      const currencies = getSupportedCurrencies();
      return NextResponse.json({
        success: true,
        data: currencies,
      });
    }

    const amount = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: 'Amount, from, and to currencies are required' },
        { status: 400 }
      );
    }

    const converted = convertCurrency(parseFloat(amount), from, to);
    const formatted = formatCurrency(converted, to);

    return NextResponse.json({
      success: true,
      original: {
        amount: parseFloat(amount),
        currency: from,
        formatted: formatCurrency(parseFloat(amount), from),
      },
      converted: {
        amount: converted,
        currency: to,
        formatted,
      },
    });
  } catch (error: any) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amounts, from, to } = body;

    if (!amounts || !Array.isArray(amounts) || !from || !to) {
      return NextResponse.json(
        { error: 'Amounts array, from, and to currencies are required' },
        { status: 400 }
      );
    }

    const converted = batchConvert(amounts, from, to);

    return NextResponse.json({
      success: true,
      from,
      to,
      conversions: amounts.map((amount, i) => ({
        original: amount,
        converted: converted[i],
        formatted: formatCurrency(converted[i], to),
      })),
    });
  } catch (error: any) {
    console.error('Batch conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch conversion failed' },
      { status: 500 }
    );
  }
}

