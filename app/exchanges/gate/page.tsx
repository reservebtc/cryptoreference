export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/GATE]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=exchange
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gate',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function GatePage() {
  return (
    <main>
      <article>
        <header>
          <h1>Gate</h1>
        </header>

        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr><td>Entity_Type</td><td>Exchange</td></tr>
              <tr><td>Entity_Subtype</td><td>Centralized</td></tr>
              <tr><td>Custody_Model</td><td>Not_Disclosed</td></tr>
              <tr><td>KYC_Requirement</td><td>Not_Disclosed</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr><td>Trading_Modes</td><td>Not_Disclosed</td></tr>
              <tr><td>Derivatives</td><td>Not_Disclosed</td></tr>
              <tr><td>Margin</td><td>Not_Disclosed</td></tr>
              <tr><td>Options</td><td>Not_Disclosed</td></tr>
              <tr><td>Copy_Trading</td><td>Not_Disclosed</td></tr>
              <tr><td>Staking</td><td>Not_Disclosed</td></tr>
              <tr><td>API_Access</td><td>Not_Disclosed</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Asset_Coverage</td><td>Not_Disclosed</td></tr>
              <tr><td>Fiat_Integration</td><td>Not_Disclosed</td></tr>
              <tr><td>Availability_Model</td><td>Jurisdiction_Dependent</td></tr>
            </tbody>
          </table>
        </section>

        {/* === CHILD ROUTER — APPEND ONLY === */}
        <section>
          <h2>Section_D</h2>
          <table>
            <tbody>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/spot-trading">Link_A</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/futures-trading">Link_B</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/trading-fees">Link_C</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/api-guide">Link_D</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/funding-rates">Link_E</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/liquidation-guide">Link_F</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/margin-trading">Link_G</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/order-types">Link_H</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/referral-program">Link_I</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/supported-chains">Link_J</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/copy-trading">Link_K</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/grid-trading">Link_L</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/portfolio-guide">Link_M</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/staking-guide">Link_N</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/trading-pairs">Link_O</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/vault-system">Link_P</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/withdrawal-limits">Link_Q</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/deposit-methods">Link_R</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/p2p-trading">Link_S</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/options-trading">Link_T</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/bot-trading">Link_U</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/leverage-guide">Link_V</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/insurance-fund">Link_W</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/security-features">Link_X</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/cross-margin">Link_Y</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/isolated-margin">Link_Z</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/risk-management">Link_AA</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/trading-bots">Link_AB</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/advanced-trading">Link_AC</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/earn-products">Link_AD</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/launchpad">Link_AE</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/web3-wallet">Link_AF</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/fee-tiers">Link_AG</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/perpetuals-guide">Link_AH</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/sub-accounts">Link_AI</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/gate/vip-program">Link_AJ</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* === RELATED / HUB LINK === */}
        <section>
          <h2>Section_E</h2>
          <table>
            <tbody>
              <tr>
                <td>Exchange_Hub</td>
                <td><a href="/exchanges">/exchanges</a></td>
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