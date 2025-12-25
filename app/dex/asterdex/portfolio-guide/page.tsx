import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Portfolio Guide | Position Management',
  description: 'Guide to portfolio management on AsterDEX. Learn about positions, balances, and account overview.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/portfolio-guide',
  },
};

export default function AsterDEXPortfolioGuidePage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Portfolio Guide</h1>
          <p><strong>Page Type:</strong> Interface Guide</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            The AsterDEX portfolio section provides comprehensive tools for managing
            positions, tracking balances, and monitoring account performance.
          </p>
        </section>

        <section>
          <h2>Portfolio Sections</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Section</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Overview</td>
                <td style={{ padding: '8px' }}>Account summary and total balance</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Positions</td>
                <td style={{ padding: '8px' }}>Open futures positions</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Orders</td>
                <td style={{ padding: '8px' }}>Pending and open orders</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>History</td>
                <td style={{ padding: '8px' }}>Transaction and trade history</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Position Information</h2>
          <ul>
            <li>Entry price and current price</li>
            <li>Position size and leverage</li>
            <li>Unrealized PnL</li>
            <li>Liquidation price</li>
            <li>Margin ratio</li>
          </ul>
        </section>

        <section>
          <h2>Account Metrics</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Metric</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Total Balance</td>
                <td style={{ padding: '8px' }}>Combined value of all assets</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Available Balance</td>
                <td style={{ padding: '8px' }}>Funds available for trading</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Margin Used</td>
                <td style={{ padding: '8px' }}>Collateral locked in positions</td>
              </tr>
            </tbody>
          </table>
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
