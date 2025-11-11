import { NextResponse } from 'next/server';

const AFFILIATE_LINKS: Record<string, string> = {
  // CEX
  'binance': 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_007U0H3CDE&utm_source=default',
  'bybit': 'https://www.bybit.com/invite?ref=YOUR_REF_HERE',
  'okx': 'https://okx.ac/join/9121732',
  
  // DEX - Perpetual Futures
  'asterdex': 'https://www.asterdex.com/en/referral/tlRYkq',
  'hibachi': 'https://hibachi.xyz/r/hibachibothub',
  'lighter': 'https://lighter.xyz/?ref=YOUR_LIGHTER_REF',
  'hyperliquid': 'https://app.hyperliquid.xyz/join/YOUR_HYPERLIQUID_REF',
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const affiliateUrl = AFFILIATE_LINKS[slug];

  if (!affiliateUrl) {
    return NextResponse.redirect('https://cryptoreference.io', 302);
  }

  console.log(`Redirecting to ${slug}: ${affiliateUrl}`);
  return NextResponse.redirect(affiliateUrl, 301);
}
