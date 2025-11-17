// app/api/swap/quote/route.ts

import { NextRequest, NextResponse } from 'next/server';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const PLATFORM_FEE_BPS = process.env.JUPITER_PLATFORM_FEE_BPS || '20';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputMint, outputMint, amount, slippageBps = 50 } = body;

    // Validate inputs
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      );
    }

    // Build Jupiter API request
    const quoteUrl = new URL(`${JUPITER_API}/quote`);
    quoteUrl.searchParams.append('inputMint', inputMint);
    quoteUrl.searchParams.append('outputMint', outputMint);
    quoteUrl.searchParams.append('amount', amount.toString());
    quoteUrl.searchParams.append('slippageBps', slippageBps.toString());
    quoteUrl.searchParams.append('platformFeeBps', PLATFORM_FEE_BPS);

    // Call Jupiter API
    const response = await fetch(quoteUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    const quote = await response.json();

    // Log for tracking
    console.log('[SWAP_QUOTE]', {
      inputMint,
      outputMint,
      amount,
      outAmount: quote.outAmount,
      platformFee: quote.platformFee,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      quote,
      summary: {
        inputAmount: amount,
        outputAmount: quote.outAmount,
        platformFee: quote.platformFee,
        priceImpactPct: quote.priceImpactPct,
      }
    });
  } catch (error: any) {
    console.error('[SWAP_QUOTE_ERROR]', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';