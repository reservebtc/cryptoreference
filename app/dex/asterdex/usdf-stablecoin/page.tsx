import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX USDF',
  description: 'AsterDEX USDF page.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/usdf-stablecoin',
  },
};

export default function AsterDEXUSDFStablecoinPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX USDF</h1>
          <div><strong>Page Type:</strong> Education</div>
        </header>

        <section>
          <h2>USDF Specifications</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Type</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Backing</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Parameter_C</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Staked Version</td>
                <td style={{ padding: '8px' }}>asUSDF</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Declared Categories</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Category_A</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Category_B</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Category_C</td>
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
            Source: asterdex.com/usdf
          </div>
        </footer>
      </article>
    </main>
  );
}
