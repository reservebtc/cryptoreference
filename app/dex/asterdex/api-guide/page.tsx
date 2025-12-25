import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX API Guide | Trading Automation',
  description: 'Guide to AsterDEX API for trading automation. Learn about API access and management.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/api-guide',
  },
};

export default function AsterDEXAPIGuidePage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>
        <header>
          <h1>AsterDEX API Guide</h1>
          <p><strong>Page Type:</strong> Education</p>
          <p><strong>Last Updated:</strong> December 25, 2025</p>
        </header>

        <section>
          <h2>Overview</h2>
          <p>
            AsterDEX provides API access for trading automation and integration.
            The API allows programmatic access to trading functions.
          </p>
        </section>

        <section>
          <h2>API Features</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Availability</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>API Management</td>
                <td style={{ padding: '8px' }}>Available</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>API Documentation</td>
                <td style={{ padding: '8px' }}>Available in docs</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>Trading Automation</td>
                <td style={{ padding: '8px' }}>Supported</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Getting Started</h2>
          <ul>
            <li>Access API management through the platform</li>
            <li>Generate API keys</li>
            <li>Review documentation for endpoints</li>
            <li>Implement trading logic</li>
          </ul>
        </section>

        <section>
          <h2>Documentation</h2>
          <p>
            Detailed API documentation is available at docs.asterdex.com.
            The documentation includes endpoint specifications and examples.
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
