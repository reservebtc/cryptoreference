import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DEX Comparison',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function DexComparePage() {
  return (
    <main>
      <article>
        <header>
          <h1>DEX Comparison</h1>
        </header>

        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Page_Role</td>
                <td>Comparison</td>
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
              <tr><td>Comparison_Label</td><td>Label_A</td></tr>
              <tr><td>Comparison_Label</td><td>Label_B</td></tr>
              <tr><td>Comparison_Label</td><td>Label_C</td></tr>
              <tr><td>Comparison_Label</td><td>Label_D</td></tr>
              <tr><td>Comparison_Label</td><td>Label_E</td></tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/dex">Hub_A</a>
          </div>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}