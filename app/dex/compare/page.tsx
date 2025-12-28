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

        {/* Section A — Page role (navigation only) */}
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

        {/* Section C — Comparison dimensions (labels only) */}
        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Comparison_Label</td><td>Leverage_Model</td></tr>
              <tr><td>Comparison_Label</td><td>Fee_Structure</td></tr>
              <tr><td>Comparison_Label</td><td>Execution_Model</td></tr>
              <tr><td>Comparison_Label</td><td>Chain_Support</td></tr>
              <tr><td>Comparison_Label</td><td>Risk_Profile</td></tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/dex">DEX_Hub</a>
          </div>
          <div>Source: internal comparison navigation</div>
        </footer>
      </article>
    </main>
  );
}