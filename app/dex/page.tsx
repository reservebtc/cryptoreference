import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DEX Directory',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function DEXHubPage() {
  return (
    <main>
      <article>
        <header>
          <h1>DEX Directory</h1>
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
                <td>/dex</td>
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
                <td><a href="/dex/asterdex">/dex/asterdex</a></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/dex/hyperliquid">/dex/hyperliquid</a></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/dex/hibachi">/dex/hibachi</a></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/dex/lighter">/dex/lighter</a></td>
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
                <td>Related_Page</td>
                <td><a href="/dex/compare">/dex/compare</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/">Root</a>
          </div>
          <div>Source: internal navigation</div>
        </footer>
      </article>
    </main>
  );
}