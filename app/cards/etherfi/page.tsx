export const CR_BLOCK = String.raw`[CR-BLOCK]
[CR/ETHERFI]
schema=CR1.0
version=1.0
canonical_hash=sha256:COMPUTE_AT_BUILD
type=card
url=
[/CR]
[/CR-BLOCK]`;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EtherFi',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function EtherFiPage() {
  return (
    <main>
      <article>
        <header>
          <h1>EtherFi</h1>
        </header>

        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Entity_Type</td>
                <td>Card</td>
              </tr>
              <tr>
                <td>KYC_Requirement</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Custody_Model</td>
                <td>Not_Disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr>
                <td>Issuance_Model</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Settlement_Model</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Supported_Assets</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Payment_Network</td>
                <td>Not_Disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr>
                <td>Card_Form_Factor</td>
                <td>Not_Disclosed</td>
              </tr>
              <tr>
                <td>Geographic_Availability</td>
                <td>Not_Disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_D</h2>
          <table>
            <tbody>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/api-guide">Link_A</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/rewards-program">Link_B</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/staking-guide">Link_C</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/supported-chains">Link_D</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/liquid-staking">Link_E</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/governance">Link_F</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/integration-guide">Link_G</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/security-features">Link_H</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/risk-management">Link_I</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/wallet-integration">Link_J</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/node-operators">Link_K</a></td>
              </tr>
              <tr>
                <td>Child_Page</td>
                <td><a href="/cards/etherfi/restaking">Link_L</a></td>
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