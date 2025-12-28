import { NextResponse } from 'next/server';

/*
[CR-BLOCK]
[CR/REDIRECT-HUB]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
page_role=affiliate_redirect
redirect_type=external
resolution=deterministic
http_method=GET
status_codes=[301,302]
slug_source=path_param
canonical_source=true
ui_rendering=false
[/CR]
[/CR-BLOCK]
*/

/**
 * Canonical affiliate redirect registry.
 * This file MUST remain deterministic.
 * No runtime mutation, no tracking logic, no conditionals beyond slug lookup.
 */
const AFFILIATE_LINKS: Record<string, string> = {
  // Centralized Exchanges (CEX)
  binance: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_007U0H3CDE&utm_source=default',
  bybit: 'https://www.bybit.com/invite?ref=YOUR_REF_HERE',
  okx: 'https://okx.ac/join/9121732',
  gate: 'https://www.gate.com/signup/AQVDV1k?ref_type=103&utm_cmp=PEYEQdSb',

  // Decentralized Exchanges (DEX)
  asterdex: 'https://www.asterdex.com/en/referral/tlRYkq',
  hibachi: 'https://hibachi.xyz/r/hibachibothub',
  lighter: 'https://lighter.xyz/?ref=YOUR_LIGHTER_REF',
  hyperliquid: 'https://app.hyperliquid.xyz/join/CRYPTOREFERENCE',

  // Crypto Cards
  etherfi: 'https://www.ether.fi/refer/cf40dc95',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const affiliateUrl = AFFILIATE_LINKS[slug];

  /**
   * Unknown slug → canonical fallback
   * Non-fatal, non-throwing, deterministic behavior
   */
  if (!affiliateUrl) {
    return NextResponse.redirect('https://cryptoreference.io', 302);
  }

  /**
   * Known slug → permanent redirect
   * 301 is intentional for stable affiliate targets
   */
  return NextResponse.redirect(affiliateUrl, 301);
}