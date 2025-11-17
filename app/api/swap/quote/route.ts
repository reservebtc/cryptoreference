import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const PLATFORM_FEE_BPS = process.env.JUPITER_PLATFORM_FEE_BPS || '20';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputMint, outputMint, amount, slippageBps = 50 } = body;

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Use direct IP to bypass DNS issues
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      platformFeeBps: PLATFORM_FEE_BPS,
    });

    // Call Jupiter API with fallback endpoints
    const endpoints = [
      `https://public.jupiterapi.com/quote?${params}`,
      `https://quote-api.jup.ag/v6/quote?${params}`,
      `https://api.jup.ag/v6/quote?${params}`,
    ];

    let lastError;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const quote = await response.json();
          
          console.log('[SWAP_QUOTE_SUCCESS]', {
            endpoint,
            inputMint,
            outputMint,
            amount,
            outAmount: quote.outAmount,
            timestamp: new Date().toISOString(),
          });

          return NextResponse.json({
            success: true,
            quote,
            summary: {
              inputAmount: amount,
              outputAmount: quote.outAmount,
              platformFee: quote.platformFee || { feeBps: PLATFORM_FEE_BPS },
              priceImpactPct: quote.priceImpactPct,
            }
          });
        }
      } catch (error) {
        lastError = error;
        console.log(`[SWAP_QUOTE] Endpoint ${endpoint} failed, trying next...`);
        continue;
      }
    }

    throw lastError || new Error('All Jupiter API endpoints failed');

  } catch (error: any) {
    console.error('[SWAP_QUOTE_ERROR]', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Jupiter API temporarily unavailable. Please try again.'
      },
      { status: 500 }
    );
  }
}

// CRITICAL: Use nodejs runtime for better DNS resolution
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';