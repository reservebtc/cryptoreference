import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Trading Fees',
  description: 'AsterDEX trading fees page.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/trading-fees',
  },
};

export default function AsterDEXTradingFeesPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Trading Fees</h1>
          <div><strong>Page Type:</strong> Education</div>
        </header>

        <section>
          <h2>Fee Types</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fee Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Maker Fee</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Taker Fee</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Funding Rate</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Fee Reduction</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Method</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Referral Program</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Volume Tiers</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Post-Only Orders</td>
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
            Source: docs.asterdex.com
          </div>
        </footer>
      </article>
    </main>
  );
}
