import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Trading Fees Guide | Fee Structure',
  description: 'Guide to AsterDEX trading fees. Learn about maker/taker fees, funding rates, and fee discounts.',
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
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX uses a maker/taker fee model for trading. Fee rates and
            discount programs are subject to platform policies.
          </p>
        </section>

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
                <td style={{ padding: '8px' }}>Fee for adding liquidity to order book</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Taker Fee</td>
                <td style={{ padding: '8px' }}>Fee for removing liquidity from order book</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Funding Rate</td>
                <td style={{ padding: '8px' }}>Periodic payment between long/short positions</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Fee Reduction Methods</h2>
          <ul>
            <li>Referral program participation</li>
            <li>Trading volume tiers</li>
            <li>Platform promotions and campaigns</li>
            <li>Post-only order type (maker only)</li>
          </ul>
        </section>

        <section>
          <h2>Fee Considerations</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Factor</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Type</td>
                <td style={{ padding: '8px' }}>Limit orders may qualify for maker rates</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Position Size</td>
                <td style={{ padding: '8px' }}>Fees calculated on notional value</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Funding Direction</td>
                <td style={{ padding: '8px' }}>Can be positive or negative</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Fee Information</h2>
          <p>
            For current fee rates and tier structures, refer to the official
            AsterDEX documentation at docs.asterdex.com.
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
