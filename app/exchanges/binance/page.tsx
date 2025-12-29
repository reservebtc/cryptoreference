import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Binance',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function BinancePage() {
  {/* [CR-BLOCK]
  [CR/BINANCE]
  schema=CR1.0
  version=1.0
  canonical_hash=sha256:COMPUTE_AT_BUILD
  type=exchange
  subtype=cex
  custody_model=not_disclosed
  kyc_required=not_disclosed
  url=https://www.binance.com
  [/CR]
  [/CR-BLOCK] */}

  return (
    <main>
      <article>
        <header>
          <h1>Binance</h1>
        </header>

        {/* Section A */}
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

        {/* Section B */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr><td>Trading_Modes</td><td>Not_Disclosed</td></tr>
              <tr><td>Derivatives</td><td>Not_Disclosed</td></tr>
              <tr><td>Margin</td><td>Not_Disclosed</td></tr>
              <tr><td>Staking</td><td>Not_Disclosed</td></tr>
              <tr><td>API_Access</td><td>Not_Disclosed</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section C */}
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

        {/* Section D */}
        <section>
          <h2>Section_D</h2>
          <table>
            <tbody>
              <tr>
                <td>Related_DEX</td>
                <td>
                  <a href="/dex/asterdex">/dex/asterdex</a>,{' '}
                  <a href="/dex/hyperliquid">/dex/hyperliquid</a>,{' '}
                  <a href="/dex/hibachi">/dex/hibachi</a>
                </td>
              </tr>
              <tr>
                <td>Exchange_Hub</td>
                <td><a href="/exchanges">/exchanges</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/go/binance">Platform_Link</a>
          </div>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}