import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Trading Pairs | Available Markets',
  description: 'Guide to trading pairs available on AsterDEX. Learn about 45+ symbols across futures and spot markets.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/trading-pairs',
  },
};

export default function AsterDEXTradingPairsPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Trading Pairs</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX offers trading across multiple cryptocurrency pairs in both
            futures and spot markets.
          </p>
        </section>

        <section>
          <h2>Market Statistics</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Trading Symbols</td>
                <td style={{ padding: '8px' }}>45</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Market Types</td>
                <td style={{ padding: '8px' }}>Futures, Spot</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Quote Currency</td>
                <td style={{ padding: '8px' }}>USDF</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Major Trading Pairs</h2>
          <p>
            AsterDEX supports major cryptocurrency pairs including:
          </p>
          <ul>
            <li>BTC perpetual futures</li>
            <li>ETH perpetual futures</li>
            <li>Other major altcoin pairs</li>
            <li>Selected spot trading pairs</li>
          </ul>
        </section>

        <section>
          <h2>Trading Features by Market</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Market Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Features</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Futures</td>
                <td style={{ padding: '8px' }}>Up to 100x leverage, funding rates</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Spot</td>
                <td style={{ padding: '8px' }}>Direct asset trading</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Finding Pairs</h2>
          <p>
            The full list of available trading pairs can be found on the
            AsterDEX trading interface. Use the market selector to browse
            all available symbols.
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
