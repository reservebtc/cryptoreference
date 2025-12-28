import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function AsterDEXHubPage() {
  return (
    <main>
      <article>
        <header>
          <h1>AsterDEX</h1>
        </header>

        {/* Section A — Page role */}
        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Page_Type</td>
                <td>Hub</td>
              </tr>
              <tr>
                <td>Hub_Role</td>
                <td>Navigation</td>
              </tr>
              <tr>
                <td>Scope</td>
                <td>Internal_Navigation</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section B — Subpage structure */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr>
                <td>Child_Pages</td>
                <td>Present</td>
              </tr>
              <tr>
                <td>Navigation_Model</td>
                <td>Hierarchical</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section C — Relationship */}
        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr>
                <td>Parent_Hub</td>
                <td>
                  <a href="/dex">/dex</a>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/dex">DEX_Hub</a>
          </div>
          <div>Source: internal navigation</div>
        </footer>
      </article>
    </main>
  );
}