import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Referral Program Guide | Earn Rebates',
  description: 'Guide to AsterDEX referral program. Learn how to earn up to 10% rebate by inviting friends.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/referral-program',
  },
};

export default function AsterDEXReferralProgramPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Referral Program</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            The AsterDEX referral program allows users to earn rebates by inviting
            friends to trade on the platform.
          </p>
        </section>

        <section>
          <h2>Referral Program Details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Maximum Rebate</td>
                <td style={{ padding: '8px' }}>Up to 10%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Tracking Method</td>
                <td style={{ padding: '8px' }}>Referral code or referral link</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>History Delay</td>
                <td style={{ padding: '8px' }}>1-2 hours</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>How It Works</h2>
          <ul>
            <li>Generate your unique referral code or link</li>
            <li>Share with friends and contacts</li>
            <li>Earn rebates based on referred users trading volume</li>
            <li>Track invitations and rewards in the dashboard</li>
          </ul>
        </section>

        <section>
          <h2>Dashboard Metrics</h2>
          <p>The referral dashboard displays:</p>
          <ul>
            <li>Total referred volume</li>
            <li>Total rewards earned</li>
            <li>Number of referred friends</li>
            <li>Trading activity of referrals</li>
          </ul>
        </section>

        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <p>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX Registration</a> (affiliate link)
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Source: asterdex.com/referral
          </p>
        </footer>
      </article>
    </main>
  );
}
