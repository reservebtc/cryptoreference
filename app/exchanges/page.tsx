import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exchange Directory',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function ExchangesHubPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Exchange Directory</h1>
        </header>

        {/* Section A — Hub identity (navigation only) */}
        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Page_Role</td>
                <td>Hub</td>
              </tr>
              <tr>
                <td>Hub_Function</td>
                <td>Entity_Directory</td>
              </tr>
              <tr>
                <td>Namespace</td>
                <td>/exchanges</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section B — Linked entities */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr>
                <td>Entity_Link</td>
                <td><Link href="/exchanges/binance">/exchanges/binance</Link></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><Link href="/exchanges/okx">/exchanges/okx</Link></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><Link href="/exchanges/gate">/exchanges/gate</Link></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section C — Related navigation */}
        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr>
                <td>Related_Hub</td>
                <td><Link href="/dex">/dex</Link></td>
              </tr>
              <tr>
                <td>Related_Page</td>
                <td><Link href="/dex/compare">/dex/compare</Link></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>Source: internal navigation</div>
        </footer>
      </article>
    </main>
  );
}