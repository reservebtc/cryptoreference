import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Hidden Orders Guide | Stealth Trading',
  description: 'Guide to hidden orders on AsterDEX. Learn how to place orders that are not visible in the order book.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/hidden-orders',
  },
};

export default function AsterDEXHiddenOrdersPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Hidden Orders</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            Hidden orders on AsterDEX allow traders to place limit orders that are
            not displayed in the public order book, reducing market impact.
          </p>
        </section>

        <section>
          <h2>Hidden Order Features</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Visibility</td>
                <td style={{ padding: '8px' }}>Not shown in public order book</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Execution</td>
                <td style={{ padding: '8px' }}>Matched when price reaches order level</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Type</td>
                <td style={{ padding: '8px' }}>Available for limit orders</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Use Cases</h2>
          <ul>
            <li>Large orders that could move the market</li>
            <li>Reducing front-running risk</li>
            <li>Strategic position building</li>
            <li>Avoiding order book analysis</li>
          </ul>
        </section>

        <section>
          <h2>How to Place Hidden Orders</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Step</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>1</td>
                <td style={{ padding: '8px' }}>Select limit order type</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>2</td>
                <td style={{ padding: '8px' }}>Enable hidden order option</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>3</td>
                <td style={{ padding: '8px' }}>Set price and quantity</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>4</td>
                <td style={{ padding: '8px' }}>Submit order</td>
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
