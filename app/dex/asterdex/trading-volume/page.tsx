import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Trading Volume & Statistics | Platform Metrics',
  description: 'AsterDEX trading volume and platform statistics. Total volume, users, open interest, and TVL data.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/trading-volume',
  },
};

export default function AsterDEXTradingVolumePage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Trading Volume & Statistics</h1>
          <p><strong>Page Type:</strong> Metrics</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX platform statistics as reported on the official website.
            These metrics are updated by the platform.
          </p>
        </section>

        <section>
          <h2>Platform Statistics</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Metric</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Trading Volume</td>
                <td style={{ padding: '8px' }}>$0.93T</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Users</td>
                <td style={{ padding: '8px' }}>1.94M</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Open Interest</td>
                <td style={{ padding: '8px' }}>$0.60B</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Value Locked (TVL)</td>
                <td style={{ padding: '8px' }}>$0.30B</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Trading Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Symbols</td>
                <td style={{ padding: '8px' }}>45</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Maximum Leverage</td>
                <td style={{ padding: '8px' }}>Up to 100x (Pro Mode)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Modes</td>
                <td style={{ padding: '8px' }}>Futures, Spot</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Data Notes</h2>
          <p>
            Statistics are sourced from the AsterDEX official website and represent
            cumulative platform data. Values may change over time as the platform
            continues to operate.
          </p>
        </section>

        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <p>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX Registration</a> (affiliate link)
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Source: asterdex.com
          </p>
        </footer>
      </article>
    </main>
  );
}
