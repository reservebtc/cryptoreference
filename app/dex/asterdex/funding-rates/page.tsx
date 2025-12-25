import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Funding Rates Explained | Perpetual Futures',
  description: 'Understanding funding rates on AsterDEX perpetual futures. Learn how funding payments work.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/funding-rates',
  },
};

export default function AsterDEXFundingRatesPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Funding Rates</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            Funding rates are periodic payments between long and short position holders
            in perpetual futures markets. They help keep the perpetual contract price
            aligned with the spot price.
          </p>
        </section>

        <section>
          <h2>Funding Rate Mechanics</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Payment Interval</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Calculation Method</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Real-time Display</td>
                <td style={{ padding: '8px' }}>Available on platform</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>How Funding Works</h2>
          <ul>
            <li>Positive funding rate: Long positions pay short positions</li>
            <li>Negative funding rate: Short positions pay long positions</li>
            <li>Funding is exchanged directly between traders</li>
            <li>Real-time funding rates displayed on the trading interface</li>
          </ul>
        </section>

        <section>
          <h2>Viewing Funding Rates</h2>
          <p>
            AsterDEX provides real-time funding rate information through the
            futures trading interface. Historical funding rate data is available
            for analysis.
          </p>
        </section>

        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <p>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX Registration</a> (affiliate link)
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Source: docs.asterdex.com
          </p>
        </footer>
      </article>
    </main>
  );
}
