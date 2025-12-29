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
                <td>Directory</td>
              </tr>
              <tr>
                <td>Namespace</td>
                <td>/dex</td>
              </tr>
            </tbody>
          </table>
        </section>

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
            <a href="/">Root_A</a>
          </div>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}