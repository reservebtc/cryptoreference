import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Interface',
  description: 'AsterDEX interface page.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/interface-overview',
  },
};

export default function AsterDEXInterfaceOverviewPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Interface</h1>
          <div><strong>Page Type:</strong> Interface</div>
        </header>

        <section>
          <h2>Declared Identifiers</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mode</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Pro Mode</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Lite Mode</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Identifier_C</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Navigation Sections</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Section</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Section_A</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Section_B</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Section_C</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Section_D</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Referral</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Interface Elements</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Element</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Chart Panel</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Element_A</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Element_B</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Element_D</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <div>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX platform link</a> (affiliate)
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Source: asterdex.com
          </div>
        </footer>
      </article>
    </main>
  );
}
