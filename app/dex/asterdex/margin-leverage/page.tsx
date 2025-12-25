import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Margin and Leverage Guide | Trading Rules',
  description: 'Understanding margin modes and leverage on AsterDEX. Learn about cross margin, isolated margin, and leverage settings.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/margin-leverage',
  },
};

export default function AsterDEXMarginLeveragePage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Margin and Leverage</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX offers flexible margin and leverage options for perpetual futures trading.
            Traders can choose between cross margin and isolated margin modes.
          </p>
        </section>

        <section>
          <h2>Leverage Options</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Maximum Leverage (Pro Mode)</td>
                <td style={{ padding: '8px' }}>Up to 100x</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>U.S. Stocks Leverage</td>
                <td style={{ padding: '8px' }}>Up to 100x</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Leverage Adjustment</td>
                <td style={{ padding: '8px' }}>Per-position configurable</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Margin Modes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mode</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Risk Profile</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Cross Margin</td>
                <td style={{ padding: '8px' }}>Shares margin across all positions</td>
                <td style={{ padding: '8px' }}>Lower liquidation risk per position</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Isolated Margin</td>
                <td style={{ padding: '8px' }}>Separate margin for each position</td>
                <td style={{ padding: '8px' }}>Limited loss per position</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Risk Management</h2>
          <p>
            AsterDEX provides advanced risk management tools for position management.
            Traders should understand margin requirements before opening leveraged positions.
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
