import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Grid Trading Guide | Automated Trading',
  description: 'Guide to grid trading on AsterDEX. Learn about manual and automated grid trading strategies.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/grid-trading',
  },
};

export default function AsterDEXGridTradingPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Grid Trading</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            Grid trading is an automated trading strategy available on AsterDEX
            that places buy and sell orders at predetermined price levels.
          </p>
        </section>

        <section>
          <h2>Grid Trading Options</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Manual Grid</td>
                <td style={{ padding: '8px' }}>User-configured grid parameters</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Automated Grid</td>
                <td style={{ padding: '8px' }}>System-optimized grid settings</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>How Grid Trading Works</h2>
          <ul>
            <li>Set upper and lower price boundaries</li>
            <li>Define number of grid levels</li>
            <li>System places orders at each grid level</li>
            <li>Profits from price oscillations within the range</li>
          </ul>
        </section>

        <section>
          <h2>Available Markets</h2>
          <p>
            Grid trading is available for futures markets on AsterDEX.
            Access through the Strategy section of the platform.
          </p>
        </section>

        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <p>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX Registration</a> (affiliate link)
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Source: asterdex.com, docs.asterdex.com
          </p>
        </footer>
      </article>
    </main>
  );
}
