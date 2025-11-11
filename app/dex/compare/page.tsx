import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Perpetual DEX 2025: AsterDEX vs Hyperliquid vs Hibachi vs Lighter',
  description: 'Side-by-side comparison of top perpetual futures DEX platforms. Compare leverage, fees, volume, and features.',
};

export default function CompareDEXPage() {
  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1>Compare Perpetual DEX 2025</h1>
      
      <p><strong>Last Updated:</strong> November 10, 2025</p>

      <p>
        Side-by-side comparison of the top perpetual futures decentralized exchanges: AsterDEX, 
        Hyperliquid, Hibachi, and Lighter.
      </p>

      <h2>Quick Comparison Table</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>DEX</th>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Leverage</th>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Chains</th>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Volume</th>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Gas Fees</th>
            <th style={{ border: '1px solid #ddd', padding: '10px' }}>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
              <a href="/dex/asterdex"><strong>AsterDEX</strong></a>
            </td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>1001x 🏆</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>4 chains 🏆</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>$32B 🏆</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Low</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Extreme leverage</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
              <a href="/dex/hyperliquid"><strong>Hyperliquid</strong></a>
            </td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>50x</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>1 chain</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>$9B</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>$0 🏆</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Pro traders</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
              <a href="/dex/hibachi"><strong>Hibachi</strong></a>
            </td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>100x</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Solana</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>$500M</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Very low</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Solana users</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
              <a href="/dex/lighter"><strong>Lighter</strong></a>
            </td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>20x</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Arbitrum</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>$200M</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Low</td>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>Arbitrum users</td>
          </tr>
        </tbody>
      </table>

      <h2>Detailed Feature Comparison</h2>

      <h3>Trading Fees</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>DEX</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maker</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>Taker</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>Gas Fees</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>AsterDEX</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.02%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.05%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Low (multi-chain)</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Hyperliquid</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.02%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.05%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}><strong>$0</strong> 🏆</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Hibachi</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.03%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.07%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Very low (Solana)</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Lighter</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.05%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>0.05%</td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Low (Arbitrum)</td>
          </tr>
        </tbody>
      </table>

      <h3>Unique Features</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>DEX</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>Unique Features</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}><strong>AsterDEX</strong></td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
              • Hidden Orders<br/>
              • Stock Perpetuals (Apple, Tesla, etc.)<br/>
              • 1001x leverage<br/>
              • Multi-chain (4 chains)
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}><strong>Hyperliquid</strong></td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
              • Zero gas fees<br/>
              • Own L1 blockchain<br/>
              • Sub-100ms finality<br/>
              • Longest track record
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}><strong>Hibachi</strong></td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
              • Solana native<br/>
              • Sub-second execution<br/>
              • Deep Solana DeFi integration
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}><strong>Lighter</strong></td>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
              • Innovative order matching<br/>
              • Capital efficient<br/>
              • Arbitrum benefits
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Which DEX Should You Choose?</h2>

      <h3>Choose AsterDEX if:</h3>
      <ul>
        <li>You want extreme leverage (1001x)</li>
        <li>You trade across multiple chains</li>
        <li>You need hidden orders (large trader)</li>
        <li>You want to trade stock perpetuals</li>
      </ul>
      <p><a href="/dex/asterdex">Read AsterDEX Review →</a></p>

      <h3>Choose Hyperliquid if:</h3>
      <ul>
        <li>You want zero gas fees</li>
        <li>You prioritize speed (sub-100ms)</li>
        <li>You prefer proven platforms</li>
        <li>You're a professional trader</li>
      </ul>
      <p><a href="/dex/hyperliquid">Read Hyperliquid Review →</a></p>

      <h3>Choose Hibachi if:</h3>
      <ul>
        <li>You're in the Solana ecosystem</li>
        <li>You want fast execution</li>
        <li>You need 100x leverage</li>
      </ul>
      <p><a href="/dex/hibachi">Read Hibachi Review →</a></p>

      <h3>Choose Lighter if:</h3>
      <ul>
        <li>You prefer Arbitrum/Ethereum</li>
        <li>You want moderate leverage (20x)</li>
        <li>You value capital efficiency</li>
      </ul>
      <p><a href="/dex/lighter">Read Lighter Review →</a></p>

      <h2>Bottom Line</h2>
      <p>
        <strong>Market Leader:</strong> AsterDEX (by volume)<br/>
        <strong>Most Reliable:</strong> Hyperliquid (by track record)<br/>
        <strong>Best for Solana:</strong> Hibachi<br/>
        <strong>Best for Ethereum:</strong> Lighter
      </p>

      <hr />
      <p><small><strong>Last Updated:</strong> November 10, 2025</small></p>
      <p><a href="/dex">← Back to DEX Directory</a></p>
    </main>
  );
}
