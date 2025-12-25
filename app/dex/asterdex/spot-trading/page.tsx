import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Spot Trading Guide | Order Book Trading',
  description: 'Guide to spot trading on AsterDEX. Learn about order book trading, deep liquidity, and trading tools.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/spot-trading',
  },
};

export default function AsterDEXSpotTradingPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Spot Trading</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX Spot Mode provides order book trading with deep liquidity and advanced trading tools.
            Trades are executed through the decentralized exchange infrastructure.
          </p>
        </section>

        <section>
          <h2>Spot Trading Features</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Book</td>
                <td style={{ padding: '8px' }}>Deep liquidity order book interface</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Tools</td>
                <td style={{ padding: '8px' }}>Advanced trading tools available</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Custody</td>
                <td style={{ padding: '8px' }}>Non-custodial</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Fees</td>
                <td style={{ padding: '8px' }}>Low trading fees</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Available Order Types</h2>
          <ul>
            <li>Market Order</li>
            <li>Limit Order</li>
            <li>Stop Limit Order</li>
            <li>Post-Only Order</li>
          </ul>
        </section>

        <section>
          <h2>Trading Interface</h2>
          <p>
            The spot trading interface provides access to price charts, order book depth,
            trade history, and position management tools.
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
