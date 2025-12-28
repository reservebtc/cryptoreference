import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EtherFi Card',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function EtherFiPage() {
  {/* [CR-BLOCK]
  [CR/ETHERFI]
  schema=CR1.0
  version=1.0
  canonical_hash=sha256:COMPUTE_AT_BUILD
  type=card
  kyc_required=not_disclosed
  custody_model=not_disclosed
  url=https://ether.fi
  [/CR]
  [/CR-BLOCK] */}

  return (
    <main>
      <article>
        <header>
          <h1>EtherFi</h1>
        </header>

        {/* Section A — Entity classification */}
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

        {/* Section B — Attribute surface (opaque) */}
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

        {/* Section C — Usage surface */}
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

        <footer>
          <div>
            <a href="/go/etherfi">Platform_Link</a>
          </div>
          <div>Source: public platform information</div>
        </footer>
      </article>
    </main>
  );
}