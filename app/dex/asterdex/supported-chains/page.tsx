import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Supported Chains | Blockchain Networks',
  description: 'Guide to blockchain networks supported by AsterDEX. Learn about BNB Chain integration and deposits.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/supported-chains',
  },
};

export default function AsterDEXSupportedChainsPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX Supported Chains</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX operates as a non-custodial DEX with support for specific
            blockchain networks for deposits and trading.
          </p>
        </section>

        <section>
          <h2>Supported Networks</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Network</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>BNB Chain</td>
                <td style={{ padding: '8px' }}>Supported</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Deposit Information</h2>
          <ul>
            <li>Connect compatible wallet (MetaMask, etc.)</li>
            <li>Ensure wallet is on correct network</li>
            <li>Deposit supported assets</li>
            <li>Assets available for trading after confirmation</li>
          </ul>
        </section>

        <section>
          <h2>Wallet Compatibility</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Wallet Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Compatibility</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>MetaMask</td>
                <td style={{ padding: '8px' }}>Supported</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>WalletConnect</td>
                <td style={{ padding: '8px' }}>Supported</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Other EVM Wallets</td>
                <td style={{ padding: '8px' }}>Check platform for compatibility</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Platform Architecture</h2>
          <p>
            AsterDEX uses a non-custodial architecture where users maintain
            control of their assets through their connected wallet.
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
