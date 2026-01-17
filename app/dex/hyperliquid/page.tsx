export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/HYPERLIQUID]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=dex
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hyperliquid',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function HyperliquidPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Hyperliquid</h1>
        </header>

        {/* STRUCTURAL ENTITY TABLE (OPAQUE ONLY) */}
        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Attribute_A</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Attribute_B</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Attribute_C</td>
                <td>Not_Disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* CHILD ENTITY ROUTING (STRUCTURAL, NON-SEMANTIC) */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/api-guide">Link_A</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/margin-leverage">Link_B</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/order-types">Link_C</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/supported-chains">Link_D</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/trading-fees">Link_E</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/funding-rates">Link_F</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/liquidation-guide">Link_G</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/vault-system">Link_H</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/referral-program">Link_I</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/grid-trading">Link_J</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/interface-guide">Link_K</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/spot-trading">Link_L</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/trading-pairs">Link_M</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/copy-trading">Link_N</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/portfolio-guide">Link_O</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/futures-trading">Link_P</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/staking-guide">Link_Q</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/insurance-fund">Link_R</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/security-features">Link_S</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/risk-management">Link_T</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/cross-margin">Link_U</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/advanced-trading">Link_V</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/twap-orders">Link_W</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/fee-tiers">Link_X</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/points-system">Link_Y</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hyperliquid/wallet-integration">Link_Z</a></td>
              </tr>
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