/* [CR-BLOCK]
[CR/HYPERLIQUID]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=dex
url=https://hyperliquid.xyz
[/CR]
[/CR-BLOCK] */

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