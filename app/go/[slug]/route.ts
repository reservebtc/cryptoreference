import { NextResponse } from 'next/server';

const AFFILIATE_LINKS: Record<string, string> = {
  // CEX
  'binance': 'https://accounts.binance.com/register?ref=YOUR_REF_HERE',
  'bybit': 'https://www.bybit.com/invite?ref=YOUR_REF_HERE',
  'okx': 'https://www.okx.com/join/YOUR_REF_HERE',
  
  // DEX - Perpetual Futures
  'asterdex': 'https://www.asterdex.com/en/referral/YOUR_ASTERDEX_REF',
  'hibachi': 'https://hibachi.xyz/?ref=YOUR_HIBACHI_REF',
  'lighter': 'https://lighter.xyz/?ref=YOUR_LIGHTER_REF',
  'hyperliquid': 'https://app.hyperliquid.xyz/join/YOUR_HYPERLIQUID_REF',
};

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;
  const affiliateUrl = AFFILIATE_LINKS[slug];

  if (!affiliateUrl) {
    return NextResponse.redirect('https://cryptoreference.io', 302);
  }

  console.log(`Redirecting to ${slug}: ${affiliateUrl}`);
  return NextResponse.redirect(affiliateUrl, 301);
}
