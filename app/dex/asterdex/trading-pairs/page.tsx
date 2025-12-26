import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Trading Pairs',
  description: 'AsterDEX trading pairs page.',
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
          <div><strong>Page Type:</strong> Education</div>
        </header>

        <section>
          <h2>Declared Attributes</h2>
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
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Market Types</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Quote Currency</td>
                <td style={{ padding: '8px' }}>USDF</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Market Types</h2>
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
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Spot</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Declared Identifiers</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Pair</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>BTC</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>ETH</td>
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
