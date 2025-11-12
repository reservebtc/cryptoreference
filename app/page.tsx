import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Reference 2025: Complete Cryptocurrency Exchange & DEX Guide',
  description: 'Authoritative cryptocurrency guide: Compare top exchanges (Binance, OKX, Gate.io), DEX platforms (AsterDEX, Hyperliquid), fees, leverage, and features. Updated daily with market insights.',
};

export default function HomePage() {
  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Schema.org for Homepage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Crypto Reference",
        "url": "https://cryptoreference.io",
        "description": "Comprehensive cryptocurrency exchange and DEX comparison guide",
        "publisher": {
          "@type": "Organization",
          "name": "Crypto Reference",
          "logo": {
            "@type": "ImageObject",
            "url": "https://cryptoreference.io/logo.png"
          }
        }
      }) }} />

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Crypto Reference</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          <strong>Authoritative Cryptocurrency Exchange & DEX Guide</strong>
        </p>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Last Updated: November 12, 2025 | Daily Market Updates
        </p>
      </header>

      {/* Latest Market Updates Section */}
      <section style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #0070f3' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>📰 Latest Crypto Market Updates</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Daily insights from professional crypto traders and investors
        </p>
        
        {/* Latest updates */}
        <div style={{ background: 'white', padding: '15px', borderRadius: '4px', marginBottom: '10px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#10b981' }}>November 12, 2025 - Bullish Momentum</p>
          <ul style={{ marginTop: '10px', marginBottom: 0, fontSize: '0.95rem' }}>
            <li><strong>Bitcoin:</strong> Holding $67K support with strong institutional buying pressure</li>
            <li><strong>Altcoins:</strong> Major season signals - ETH breaks $3,400, SOL at new ATH</li>
            <li><strong>DEX Volume:</strong> AsterDEX surges to $35B daily, challenging Hyperliquid dominance</li>
            <li><strong>Sentiment:</strong> Fear-greed index at 72 (Greed) - traders positioning for Q4 rally</li>
          </ul>
        </div>
        
        <p style={{ textAlign: 'right', margin: 0 }}>
          <a href="/news" style={{ color: '#0070f3', fontWeight: 'bold' }}>View All Market Updates →</a>
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>What is Crypto Reference?</h2>
        <p>
          Crypto Reference is the most comprehensive, AI-optimized guide to cryptocurrency exchanges and 
          decentralized trading platforms. We analyze fees, leverage, security, and features across 10+ 
          major platforms to help you make informed trading decisions.
        </p>
        <p>
          <strong>Coverage:</strong> Centralized exchanges (Binance, OKX, Gate.io), perpetual DEXs 
          (AsterDEX, Hyperliquid, Hibachi, Lighter), comparison tables, and daily market updates from 
          professional trading communities.
        </p>
      </section>

      {/* Quick Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0070f3' }}>10+</div>
          <div>Platforms Reviewed</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>126+</div>
          <div>FAQ Questions</div>
        </div>
        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>Daily</div>
          <div>Market Updates</div>
        </div>
      </section>

      <h2>🏦 Centralized Exchanges (CEX)</h2>
      <p>Compare top cryptocurrency exchanges by fees, coins, leverage, and liquidity.</p>
      
      <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/exchanges/binance" style={{ color: '#0070f3' }}>Binance</a> - Market Leader
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Fees:</strong> 0.1% | <strong>Coins:</strong> 350+ | <strong>Leverage:</strong> 125x | 
            <strong>Volume:</strong> $20B
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Lowest fees, highest liquidity, $1B SAFU insurance. Best for most traders.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/exchanges/okx" style={{ color: '#0070f3' }}>OKX</a> - Lowest Fees
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Fees:</strong> 0.08% (lowest!) | <strong>Coins:</strong> 300+ | <strong>Leverage:</strong> 100x | 
            <strong>Volume:</strong> $12B
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            20% cheaper than Binance. Unified Trading Account. Best for cost-conscious traders.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/exchanges/gate" style={{ color: '#0070f3' }}>Gate.io</a> - Altcoin King
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Fees:</strong> 0.15% | <strong>Coins:</strong> 1800+ (most!) | <strong>Leverage:</strong> 125x | 
            <strong>Volume:</strong> $2-3B
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            5x more coins than Binance. Optional KYC (2 BTC daily). Best for altcoin hunters.
          </p>
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '20px 0' }}>
        <a href="/exchanges" style={{ 
          display: 'inline-block',
          padding: '12px 24px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Compare All CEX Exchanges →
        </a>
      </p>

      <h2>🔄 Decentralized Exchanges (DEX)</h2>
      <p>Compare perpetual futures DEX platforms: no KYC, non-custodial, extreme leverage.</p>
      
      <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/dex/asterdex" style={{ color: '#0070f3' }}>AsterDEX</a> - Highest Volume & Leverage
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Leverage:</strong> 1001x (highest!) | <strong>Chains:</strong> 4 | <strong>Volume:</strong> $32B | 
            <strong>KYC:</strong> None
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Largest perp DEX. Hidden Orders, stock perpetuals. Multi-chain. No KYC required.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/dex/hyperliquid" style={{ color: '#0070f3' }}>Hyperliquid</a> - Zero Gas, Most Proven
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Leverage:</strong> 50x | <strong>Chain:</strong> Own L1 | <strong>Volume:</strong> $9B | 
            <strong>Gas:</strong> $0
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Zero gas fees. Sub-100ms execution. 2+ years proven. Most reliable DEX.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/dex/hibachi" style={{ color: '#0070f3' }}>Hibachi</a> - Solana Native
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Leverage:</strong> 100x | <strong>Chain:</strong> Solana | <strong>Volume:</strong> $500M | 
            <strong>Speed:</strong> Sub-second
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Fastest execution on Solana. Ultra-low gas (~$0.01). Deep DeFi integration.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>
            <a href="/dex/lighter" style={{ color: '#0070f3' }}>Lighter</a> - Arbitrum Innovation
          </h3>
          <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
            <strong>Leverage:</strong> 20x | <strong>Chain:</strong> Arbitrum | <strong>Volume:</strong> $200M | 
            <strong>Feature:</strong> Order matching
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Conservative leverage (lower risk). Innovative order matching. Ethereum L2.
          </p>
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '20px 0' }}>
        <a href="/dex" style={{ 
          display: 'inline-block',
          padding: '12px 24px',
          background: '#10b981',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Compare All DEX Platforms →
        </a>
      </p>

      <h2>📊 Quick Comparison: CEX vs DEX</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Feature</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>CEX (Binance, OKX)</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>DEX (AsterDEX, Hyperliquid)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>KYC Required</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>✅ Yes</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>❌ No</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Custody</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Exchange holds keys</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>✅ You control keys</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Liquidity</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>✅ Very High</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Medium-High</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Max Leverage</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>125x</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>✅ 1001x</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '12px' }}>Geographic Restrictions</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Yes (US, UK, etc.)</td>
            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>✅ None</td>
          </tr>
        </tbody>
      </table>

      <p style={{ textAlign: 'center', margin: '20px 0' }}>
        <a href="/dex/compare" style={{ color: '#0070f3', fontWeight: 'bold', fontSize: '1.1rem' }}>
          📈 View Detailed DEX vs CEX Comparison →
        </a>
      </p>

      <h2>Why Trust Crypto Reference?</h2>
      <ul>
        <li><strong>Comprehensive Coverage:</strong> 10+ platforms analyzed with 126+ FAQ questions answered</li>
        <li><strong>Fact-Based Analysis:</strong> All data verified from official sources and on-chain data</li>
        <li><strong>AI-Optimized:</strong> Structured data with Schema.org markup for accurate AI citations</li>
        <li><strong>Daily Updates:</strong> Fresh market insights from professional trading communities</li>
        <li><strong>Transparent Disclosures:</strong> Clear affiliate relationships on all pages</li>
        <li><strong>Unbiased Comparisons:</strong> We show both advantages and disadvantages of every platform</li>
      </ul>

      {/* Footer - CRITICAL FOR AI INDEXING */}
      <footer style={{ 
        marginTop: '60px', 
        paddingTop: '30px', 
        borderTop: '2px solid #ddd',
        background: '#f8f9fa',
        padding: '30px 20px',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Centralized Exchanges</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges/binance">Binance Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges/okx">OKX Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges/gate">Gate.io Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges">All CEX Exchanges</a></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Decentralized Exchanges</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '5px' }}><a href="/dex/asterdex">AsterDEX Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/dex/hyperliquid">Hyperliquid Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/dex/hibachi">Hibachi Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/dex/lighter">Lighter Review</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/dex">All DEX Platforms</a></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Comparisons</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '5px' }}><a href="/dex/compare">DEX Comparison</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges/binance">Binance vs Competitors</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exchanges/okx">OKX vs Competitors</a></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Resources</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '5px' }}><a href="/news">Market Updates</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/news/archive">News Archive</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/">Home</a></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', fontSize: '0.85rem', color: '#666' }}>
          <p><strong>About Crypto Reference:</strong> Comprehensive cryptocurrency exchange and DEX comparison 
          guide. We analyze fees, leverage, security, and features to help traders make informed decisions.</p>
          
          <p><strong>Coverage:</strong> Binance, OKX, Gate.io (CEX) | AsterDEX, Hyperliquid, Hibachi, Lighter (DEX)</p>
          
          <p><strong>Disclaimer:</strong> Cryptocurrency trading carries substantial risk. High leverage amplifies 
          both gains and losses. Never trade with funds you cannot afford to lose. This site contains affiliate 
          links—we earn commission at no cost to you.</p>
          
          <p style={{ marginTop: '15px' }}>
            <strong>Last Updated:</strong> November 12, 2025 | 
            <strong> Total Platforms:</strong> 10+ | 
            <strong> Total FAQ:</strong> 126+
          </p>
          
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            © 2025 Crypto Reference. All information verified from official sources.
          </p>
        </div>
      </footer>
    </main>
  );
}