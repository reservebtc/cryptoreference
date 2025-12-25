import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Earn Features | Staking & Yield',
  description: 'Guide to earning features on AsterDEX. Learn about USDF staking, asUSDF yields, and reward programs.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/earn-features',
  },
};

export default function AsterDEXEarnFeaturesPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Earn Features</h1>
          <p><strong>Page Type:</strong> Interface Guide</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX provides multiple earning opportunities through its Earn section,
            including staking, yield generation, and reward programs.
          </p>
        </section>

        <section>
          <h2>Earning Options</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Option</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Potential APY</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>asUSDF Staking</td>
                <td style={{ padding: '8px' }}>Up to 15%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>USDF Deposit</td>
                <td style={{ padding: '8px' }}>Variable</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trade APY</td>
                <td style={{ padding: '8px' }}>Based on weekly volume</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Earn Interface</h2>
          <ul>
            <li>Stake USDF to receive asUSDF</li>
            <li>Track accumulated rewards</li>
            <li>View APY breakdown by component</li>
            <li>Manage staking positions</li>
          </ul>
        </section>

        <section>
          <h2>Yield Components</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Deposit APY</td>
                <td style={{ padding: '8px' }}>Protocol rewards</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trade APY</td>
                <td style={{ padding: '8px' }}>Trading activity bonuses</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Points Multiplier</td>
                <td style={{ padding: '8px' }}>Au points for airdrop</td>
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
