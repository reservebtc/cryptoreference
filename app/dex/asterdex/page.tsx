export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/ASTERDEX]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=dex
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function AsterDEXPage() {
  return (
    <main>
      <article>
        <header>
          <h1>AsterDEX</h1>
        </header>

        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/api-guide">/dex/asterdex/api-guide</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/apx-token">/dex/asterdex/apx-token</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/campaigns">/dex/asterdex/campaigns</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/earn-features">/dex/asterdex/earn-features</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/funding-rates">/dex/asterdex/funding-rates</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/futures-trading">/dex/asterdex/futures-trading</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/grid-trading">/dex/asterdex/grid-trading</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/hidden-orders">/dex/asterdex/hidden-orders</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/interface-overview">/dex/asterdex/interface-overview</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/leverage-1001x">/dex/asterdex/leverage-1001x</a></td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/liquidation-guide">/dex/asterdex/liquidation-guide</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/margin-leverage">/dex/asterdex/margin-leverage</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/order-types">/dex/asterdex/order-types</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/portfolio-guide">/dex/asterdex/portfolio-guide</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/referral-program">/dex/asterdex/referral-program</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/spot-trading">/dex/asterdex/spot-trading</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/supported-chains">/dex/asterdex/supported-chains</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/trading-fees">/dex/asterdex/trading-fees</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/trading-pairs">/dex/asterdex/trading-pairs</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/trading-volume">/dex/asterdex/trading-volume</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/usdf-stablecoin">/dex/asterdex/usdf-stablecoin</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/vault-system">/dex/asterdex/vault-system</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/copy-trading">/dex/asterdex/copy-trading</a></td></tr>
              <tr><td>Content_Link</td><td><a href="/dex/asterdex/staking-guide">/dex/asterdex/staking-guide</a></td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Parent_Hub</td><td><a href="/dex">/dex</a></td></tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}
