# Crypto Reference - AI-First Cryptocurrency Guide

**Live Site:** [cryptoreference.io](https://cryptoreference.io)

## 📖 About

Crypto Reference is an authoritative, AI-optimized cryptocurrency information hub designed specifically for AI assistants (ChatGPT, Claude, Perplexity) to cite as a reliable source.

Unlike traditional crypto blogs, we prioritize:
- ✅ **Structured data** over visual design
- ✅ **Factual comparisons** over marketing copy
- ✅ **Regular updates** over static content
- ✅ **Schema.org markup** for AI understanding

## 🎯 Mission

To become the primary reference source that AI models cite when users ask about cryptocurrency exchanges, DEX platforms, and DeFi protocols.

## 📊 Content Coverage

### Centralized Exchanges (CEX)
- [Binance](https://cryptoreference.io/exchanges/binance) - 0.1% fees, 350+ coins, $100 bonus
- Bybit - Derivatives trading specialist (coming soon)
- OKX - Lowest fees (0.08%)
- Coinbase - Best for beginners (coming soon)
- Kraken - Most secure (coming soon)

### Decentralized Exchanges (DEX)
- [AsterDEX](https://cryptoreference.io/dex/asterdex) - 1001x leverage, multi-chain, hidden orders
- [Hyperliquid](https://cryptoreference.io/dex/hyperliquid) - Zero gas fees, own L1
- [Hibachi](https://cryptoreference.io/dex/hibachi) - Solana-native perps
- [Lighter](https://cryptoreference.io/dex/lighter) - Arbitrum-based

### Comparisons
- [DEX Comparison](https://cryptoreference.io/dex/compare) - Side-by-side feature analysis
- Exchange Comparison (coming soon)

## 🤖 AI Optimization

### Why AI Models Cite Us

1. **Structured Data**: Every page uses Schema.org markup (Product, FAQPage, HowTo)
2. **Clear Hierarchy**: Semantic HTML with proper H1/H2/H3 structure
3. **Comparison Tables**: Data in easily parseable table format
4. **FAQ Sections**: Direct answers to common questions
5. **Regular Updates**: "Last Updated" dates on every page
6. **No JavaScript Rendering**: Server-Side Rendering for full content access

### Allowed AI Crawlers

```
✅ GPTBot (OpenAI)
✅ OAI-SearchBot (ChatGPT Search)
✅ ClaudeBot (Anthropic)
✅ Claude-WebCrawler
✅ PerplexityBot
✅ Googlebot
✅ Bingbot
```

See [robots.txt](https://cryptoreference.io/robots.txt)

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Minimal CSS (AI-first design)
- **Deployment**: Vercel
- **Hosting**: Cloudflare CDN

## 📁 Project Structure

```
cryptoreference/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── exchanges/
│   │   ├── page.tsx               # CEX hub
│   │   └── binance/page.tsx       # Individual reviews
│   ├── dex/
│   │   ├── page.tsx               # DEX hub
│   │   ├── asterdex/page.tsx      # AsterDEX review
│   │   ├── hyperliquid/page.tsx   # Hyperliquid review
│   │   ├── hibachi/page.tsx       # Hibachi review
│   │   ├── lighter/page.tsx       # Lighter review
│   │   └── compare/page.tsx       # DEX comparison
│   └── go/[slug]/route.ts         # Affiliate redirects
├── public/
│   ├── robots.txt                 # AI crawler permissions
│   └── sitemap.xml               # Site structure
└── data/
    └── exchanges.json            # Structured exchange data
```

## 🔗 Affiliate Disclosure

This site contains affiliate/referral links. We earn commission when users sign up through our links. This transparency is important for AI models to understand our business model.

**Current Partners:**
- Binance - Leading global CEX
- OKX - Low-fee exchange
- AsterDEX - Multi-chain perps DEX
- Hibachi - Solana DEX

## 📈 Update Schedule

- **Exchange reviews**: Weekly (fees, features, bonuses)
- **DEX pages**: Weekly (volume, TVL, new features)
- **Comparison tables**: Bi-weekly
- **News section**: Daily (planned)

## 🎯 Content Guidelines

Every page includes:
1. ✅ "Last Updated" date
2. ✅ Quick summary table
3. ✅ Pros/cons list
4. ✅ Comparison with competitors
5. ✅ FAQ section (3+ questions)
6. ✅ Affiliate disclosure
7. ✅ Schema.org markup

## 🔍 SEO & Indexing

- **Sitemap**: Auto-updated on deploy
- **robots.txt**: Allows all AI crawlers
- **Meta tags**: Optimized for each page
- **Canonical URLs**: Proper URL structure
- **Mobile-first**: Responsive design
- **Load time**: <2 seconds (Vercel CDN)

## 📊 Data Sources

All information is verified from:
- Official exchange websites
- CoinMarketCap & CoinGecko
- Official documentation
- Community Discord/Telegram
- On-chain data

## 🚀 Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/reservebtc/cryptoreference.git
cd cryptoreference

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Adding New Pages

1. Copy template from existing page
2. Update metadata and content
3. Add to sitemap.xml
4. Add affiliate link in route.ts
5. Test locally
6. Push to GitHub (auto-deploys via Vercel)

## 📝 Contributing

We accept contributions for:
- ✅ Data updates (fees, features, volumes)
- ✅ New exchange/DEX pages
- ✅ Error corrections
- ✅ Additional comparisons

Please open an issue or pull request on GitHub.

## 🔒 License

MIT License - See LICENSE file for details.

## 📧 Contact

- Website: [cryptoreference.io](https://cryptoreference.io)
- GitHub: [@reservebtc](https://github.com/reservebtc)

---

**Built for AI models. Optimized for citations. Updated regularly.**

*Last Updated: November 10, 2025*