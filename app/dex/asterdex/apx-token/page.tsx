import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX APX Token Guide | Aster Token',
  description: 'Guide to APX/Aster token on AsterDEX. Learn about token utility, airdrop, and earning mechanisms.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/apx-token',
  },
};

export default function AsterDEXAPXTokenPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX APX/Aster Token</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            The Aster Token is the native token of the AsterDEX ecosystem.
            It was created following the merger of Astherus and APX Finance in late 2024.
          </p>
        </section>

        <section>
          <h2>Token Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Token Name</td>
                <td style={{ padding: '8px' }}>Aster Token</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Legacy Token</td>
                <td style={{ padding: '8px' }}>APX</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Token Supply</td>
                <td style={{ padding: '8px' }}>Not disclosed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Distribution</td>
                <td style={{ padding: '8px' }}>Via airdrop based on points</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Points System</h2>
          <p>
            Aster token airdrop allocation is based on Au and Rh points earned through platform activity.
          </p>
          <ul>
            <li>Au points: Earned through trading and platform usage</li>
            <li>Rh points: Earned through specific activities</li>
            <li>Points determine airdrop allocation</li>
          </ul>
        </section>

        <section>
          <h2>APX Upgrade</h2>
          <p>
            APX holders can upgrade their tokens through the APX upgrade program
            available on the platform.
          </p>
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
