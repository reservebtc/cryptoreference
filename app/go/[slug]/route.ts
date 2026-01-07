import { NextResponse } from 'next/server';

/*
  AFFILIATE REDIRECT INFRASTRUCTURE
  NON-CANONICAL
  OUTSIDE CR GRAPH

  GOVERNED BY:
  - spec5.md (Affiliate Isolation)
  - spec9.md (Affiliate Infrastructure Isolation Law)

  HARD RULES:
  - NO CR-BLOCK
  - NO REGISTRY ACCESS
  - NO DATASET ACCESS
  - DETERMINISTIC ONLY
  - PURE REDIRECT LOGIC
*/

const AFFILIATE_LINKS: Record<string, string> = {
  binance:
    'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_007U0H3CDE&utm_source=default',

  bybit:
    'https://www.bybit.com/invite?ref=YOUR_REF_HERE',

  okx:
    'https://okx.ac/join/9121732',

  gate:
    'https://www.gate.com/signup/AQVDV1k?ref_type=103&utm_cmp=PEYEQdSb',

  asterdex:
    'https://www.asterdex.com/en/referral/tlRYkq',

  hibachi:
    'https://hibachi.xyz/r/hibachibothub',

  lighter:
    'https://lighter.xyz/?ref=YOUR_LIGHTER_REF',

  hyperliquid:
    'https://app.hyperliquid.xyz/join/CRYPTOREFERENCE',

  etherfi:
    'https://www.ether.fi/refer/cf40dc95',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const target = AFFILIATE_LINKS[slug];

  if (!target) {
    // spec9 §9: MUST NOT redirect to Root
    return new NextResponse(null, { status: 404 });
  }

  // Stable affiliate redirect
  return NextResponse.redirect(target, 301);
}