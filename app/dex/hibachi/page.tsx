export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/HIBACHI]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=dex
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hibachi',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function HibachiPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Hibachi</h1>
        </header>

        {/* STRUCTURAL ENTITY TABLE */}
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
                <td><a href="/dex/hibachi/api-guide">Link_A</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/margin-leverage">Link_B</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/order-types">Link_C</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/supported-chains">Link_D</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/trading-fees">Link_E</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/funding-rates">Link_F</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/liquidation-guide">Link_G</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/referral-program">Link_H</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/spot-trading">Link_I</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/grid-trading">Link_J</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/interface-guide">Link_K</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/portfolio-guide">Link_L</a></td>
              </tr>
              <tr>
                <td>Child_Link</td>
                <td><a href="/dex/hibachi/trading-pairs">Link_M</a></td>
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