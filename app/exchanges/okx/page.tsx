export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/OKX]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=exchange
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OKX',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function OKXPage() {
  return (
    <main>
      <article>
        <header>
          <h1>OKX</h1>
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
              <tr><td>Automation</td><td>Not_Disclosed</td></tr>
              <tr><td>API_Access</td><td>Not_Disclosed</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Asset_Coverage</td><td>Not_Disclosed</td></tr>
              <tr><td>Account_Model</td><td>Not_Disclosed</td></tr>
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
                <td><a href="/exchanges/okx/spot-trading">Link_A</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/futures-trading">Link_B</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/api-guide">Link_C</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/margin-trading">Link_D</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/trading-fees">Link_E</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/order-types">Link_F</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/referral-program">Link_G</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/supported-chains">Link_H</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/copy-trading">Link_I</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/funding-rates">Link_J</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/liquidation-guide">Link_K</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/grid-trading">Link_L</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/portfolio-guide">Link_M</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/staking-guide">Link_N</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/trading-pairs">Link_O</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/vault-system">Link_P</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/withdrawal-limits">Link_Q</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/deposit-methods">Link_R</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/p2p-trading">Link_S</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/options-trading">Link_T</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/bot-trading">Link_U</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/leverage-guide">Link_V</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/insurance-fund">Link_W</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/security-features">Link_X</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/cross-margin">Link_Y</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/isolated-margin">Link_Z</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/risk-management">Link_AA</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/trading-bots">Link_AB</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/advanced-trading">Link_AC</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/earn-products">Link_AD</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/launchpad">Link_AE</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/web3-wallet">Link_AF</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/fee-tiers">Link_AG</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/perpetuals-guide">Link_AH</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/sub-accounts">Link_AI</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/vip-program">Link_AJ</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/exchanges/okx/convert-trading">Link_AK</a></td>
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