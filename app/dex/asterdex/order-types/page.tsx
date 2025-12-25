import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Order Types Guide | Trading Orders',
  description: 'Complete guide to order types on AsterDEX. Learn about market, limit, stop, trailing stop, and hidden orders.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/order-types',
  },
};

export default function AsterDEXOrderTypesPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Order Types</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX supports multiple order types for flexible trade execution.
            Each order type serves different trading strategies and risk management needs.
          </p>
        </section>

        <section>
          <h2>Available Order Types</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Order Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Market Order</td>
                <td style={{ padding: '8px' }}>Executes immediately at current price</td>
                <td style={{ padding: '8px' }}>Immediate execution</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Limit Order</td>
                <td style={{ padding: '8px' }}>Executes at specified price or better</td>
                <td style={{ padding: '8px' }}>Price control</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Stop Limit</td>
                <td style={{ padding: '8px' }}>Limit order triggered at stop price</td>
                <td style={{ padding: '8px' }}>Risk management</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Stop Market</td>
                <td style={{ padding: '8px' }}>Market order triggered at stop price</td>
                <td style={{ padding: '8px' }}>Stop loss execution</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trailing Stop</td>
                <td style={{ padding: '8px' }}>Stop price follows market movement</td>
                <td style={{ padding: '8px' }}>Profit protection</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Post-Only</td>
                <td style={{ padding: '8px' }}>Only executes as maker order</td>
                <td style={{ padding: '8px' }}>Fee optimization</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Hidden Order</td>
                <td style={{ padding: '8px' }}>Not visible in order book</td>
                <td style={{ padding: '8px' }}>Large order execution</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Hidden Orders</h2>
          <p>
            Hidden orders are limit orders that stay fully hidden from the public order book.
            Size and direction are not shown to other market participants.
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
