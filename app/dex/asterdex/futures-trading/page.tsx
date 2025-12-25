import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Futures Trading Guide | Perpetual Contracts',
  description: 'Guide to futures trading on AsterDEX. Learn about perpetual contracts, leverage up to 100x, order types, and trading mechanics.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/futures-trading',
  },
};

export default function AsterDEXFuturesTradingPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Futures Trading</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX offers perpetual futures trading through its Pro Mode interface.
            The platform provides order book trading with deep liquidity and advanced trading tools.
          </p>
        </section>

        <section>
          <h2>Trading Modes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mode</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Interface</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Pro Mode (Perpetual)</td>
                <td style={{ padding: '8px' }}>Order book interface with deep liquidity</td>
                <td style={{ padding: '8px' }}>Advanced</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>1001x Mode (Simple)</td>
                <td style={{ padding: '8px' }}>On-chain liquidity, one-click trading</td>
                <td style={{ padding: '8px' }}>Simplified</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Key Features</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Maximum Leverage</td>
                <td style={{ padding: '8px' }}>Up to 100x</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Symbols</td>
                <td style={{ padding: '8px' }}>45 symbols</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Margin Modes</td>
                <td style={{ padding: '8px' }}>Cross margin, Isolated margin</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Architecture</td>
                <td style={{ padding: '8px' }}>Non-custodial</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Order Types Available</h2>
          <ul>
            <li>Market Order</li>
            <li>Limit Order</li>
            <li>Stop Limit Order</li>
            <li>Stop Market Order</li>
            <li>Trailing Stop Order</li>
            <li>Post-Only Order</li>
            <li>Hidden Order</li>
          </ul>
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
                <td style={{ padding: '8px' }}>Open Interest</td>
                <td style={{ padding: '8px' }}>$0.60B</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Users</td>
                <td style={{ padding: '8px' }}>1.94M</td>
              </tr>
            </tbody>
          </table>
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
