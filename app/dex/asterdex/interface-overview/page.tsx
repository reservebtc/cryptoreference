import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Interface Overview | Trading Platform Guide',
  description: 'Overview of AsterDEX trading interface. Learn about Pro Mode, Lite Mode, and platform navigation.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/interface-overview',
  },
};

export default function AsterDEXInterfaceOverviewPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Interface Overview</h1>
          <p><strong>Page Type:</strong> Interface Guide</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX provides a trading interface with multiple modes designed for
            different user experience levels. The platform supports both futures
            and spot trading through a unified interface.
          </p>
        </section>

        <section>
          <h2>Trading Modes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mode</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Pro Mode</td>
                <td style={{ padding: '8px' }}>Full-featured trading with up to 100x leverage</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Lite Mode</td>
                <td style={{ padding: '8px' }}>Simplified interface for basic trading</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>1001x Mode</td>
                <td style={{ padding: '8px' }}>High-risk mode with extreme leverage</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Main Navigation</h2>
          <ul>
            <li>Trade: Access futures and spot markets</li>
            <li>Earn: Staking and yield opportunities</li>
            <li>Strategy: Grid trading and automation</li>
            <li>Portfolio: Position and balance management</li>
            <li>Referral: Invitation program access</li>
          </ul>
        </section>

        <section>
          <h2>Interface Elements</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Element</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Chart Panel</td>
                <td style={{ padding: '8px' }}>Price charts and technical analysis</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Book</td>
                <td style={{ padding: '8px' }}>Market depth and liquidity</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Order Panel</td>
                <td style={{ padding: '8px' }}>Order placement and configuration</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Positions Panel</td>
                <td style={{ padding: '8px' }}>Active positions and orders</td>
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
