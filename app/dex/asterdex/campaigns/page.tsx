import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Campaigns & Promotions | Trading Rewards',
  description: 'Guide to AsterDEX campaigns and promotions. Learn about trading competitions and reward programs.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/campaigns',
  },
};

export default function AsterDEXCampaignsPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Campaigns & Promotions</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX runs various campaigns and promotional programs to reward
            active traders. Campaign availability varies over time.
          </p>
        </section>

        <section>
          <h2>Campaign Types</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Competitions</td>
                <td style={{ padding: '8px' }}>Volume-based reward events</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Points Campaigns</td>
                <td style={{ padding: '8px' }}>Au and Rh points earning events</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Referral Bonuses</td>
                <td style={{ padding: '8px' }}>Enhanced referral rewards</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Points System</h2>
          <p>
            AsterDEX uses a points system for airdrop allocation:
          </p>
          <ul>
            <li>Au points: Earned through trading and platform activity</li>
            <li>Rh points: Earned through specific promotional activities</li>
            <li>Points contribute to Aster token airdrop allocation</li>
          </ul>
        </section>

        <section>
          <h2>Accessing Campaigns</h2>
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
                <td style={{ padding: '8px' }}>Connect wallet to AsterDEX</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>2</td>
                <td style={{ padding: '8px' }}>Check active campaigns on platform</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>3</td>
                <td style={{ padding: '8px' }}>Participate according to campaign rules</td>
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
